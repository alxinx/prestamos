'use strict'

require('dotenv').config()

const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')

const prisma = require('./src/lib/prisma')
const { redis, redisConfig } = require('./src/lib/redis')
const { registrarJobsRecurrentes } = require('./src/queues')
const { crearWorkerActividad } = require('./src/queues/workers/actividadTenants.worker')
const { globalLimiter } = require('./src/middleware/rateLimiter')
const healthRouter = require('./src/routes/health')
const masterAdminAuthRouter = require('./src/modules/masterAdmin/auth.routes')
const masterAdminPlanesRouter = require('./src/modules/masterAdmin/planes.routes')
const masterAdminTenantsRouter = require('./src/modules/masterAdmin/tenants.routes')
const masterAdminDatosSaasRouter = require('./src/modules/masterAdmin/datosSaas.routes')
const activacionRouter           = require('./src/modules/activacion/activacion.routes')
const activacionColaboradorRouter = require('./src/modules/activacionColaborador/activacionColaborador.routes')
const verificacionRouter         = require('./src/modules/verificacion/verificacion.routes')
const tenantAuthRouter           = require('./src/modules/tenant/auth.routes')
const tenantColaboradoresRouter  = require('./src/modules/tenant/colaboradores/colaboradores.routes')
const tenantSociosRouter         = require('./src/modules/tenant/socios/socios.routes')
const tenantCapitalRouter        = require('./src/modules/tenant/capital/capital.routes')
const tenantClientesRouter       = require('./src/modules/tenant/clientes/clientes.routes')
const tenantZonasRouter          = require('./src/modules/tenant/zonas/zonas.routes')

const app = express()
app.disable('x-powered-by')
const PORT = Number(process.env.APP_PORT) || 3000

// ── IP real del cliente ───────────────────────────────────────────────────────
// TRUST_PROXY_HOPS = cantidad de proxies confiables delante de la app (0 si no
// hay ninguno, ej. este entorno). Con 0, Express ignora X-Forwarded-For por
// completo y req.ip usa la IP de socket real — necesario para que el whitelist
// de IP del MasterAdmin (auth.service.js) no se pueda evadir con un header
// falsificado. Si en el futuro se pone un reverse proxy/ALB real delante,
// subir este número al conteo exacto de saltos confiables, nunca a 'true'.
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 0)

// ── Protección contra prototype pollution (CLAUDE.md §6) ─────────────────────
// Object.freeze(Object.prototype) rompe librerías npm (Prisma, ioredis, etc.).
// La protección se implementa como middleware de sanitización de request bodies.
const CLAVES_PELIGROSAS = new Set(['__proto__', 'constructor', 'prototype'])
function sanitizarObjeto(obj) {
  if (!obj || typeof obj !== 'object') return obj
  for (const clave of Object.keys(obj)) {
    if (CLAVES_PELIGROSAS.has(clave)) {
      delete obj[clave]
    } else {
      sanitizarObjeto(obj[clave])
    }
  }
  return obj
}
app.use((req, _res, next) => {
  if (req.body)   sanitizarObjeto(req.body)
  if (req.query)  sanitizarObjeto(req.query)
  if (req.params) sanitizarObjeto(req.params)
  next()
})

// ── Seguridad: headers HTTP ──────────────────────────────────────────────────
app.use(helmet())

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true, // necesario para cookies httpOnly
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// ── Parsers ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(cookieParser())

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(process.env.LOG_FORMAT || 'dev'))

// ── Rate limiting global (primera línea contra DoS) ──────────────────────────
app.use('/api', globalLimiter)

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api', healthRouter)
app.use('/api/master-admin/auth', masterAdminAuthRouter)
app.use('/api/master-admin/planes', masterAdminPlanesRouter)
app.use('/api/master-admin/tenants', masterAdminTenantsRouter)
app.use('/api/master-admin/datos-saas', masterAdminDatosSaasRouter)
app.use('/api/activar',      activacionRouter)
app.use('/api/activar-colaborador', activacionColaboradorRouter)
app.use('/api/verificar',    verificacionRouter)
app.use('/api/tenant/auth', tenantAuthRouter)
app.use('/api/tenant/colaboradores', tenantColaboradoresRouter)
app.use('/api/tenant/socios', tenantSociosRouter)
app.use('/api/tenant/capital', tenantCapitalRouter)
app.use('/api/tenant/clientes', tenantClientesRouter)
app.use('/api/tenant/zonas-cobertura', tenantZonasRouter)

// ── Manejo global de errores ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development'
  const status = err.status || err.statusCode || 500

  console.error(`[Error] ${err.message}`)

  // En producción nunca exponer stack traces
  res.status(status).json({
    error: isDev ? err.message : 'Error interno del servidor',
    ...(isDev && { stack: err.stack }),
  })
})

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// ── Inicio del servidor ───────────────────────────────────────────────────────
async function conectarDB(reintentos = 5, esperaMs = 3000) {
  for (let i = 1; i <= reintentos; i++) {
    try {
      await prisma.$connect()
      return
    } catch (err) {
      if (i === reintentos) throw err
      console.log(`[DB] Intento ${i}/${reintentos} fallido — reintentando en ${esperaMs / 1000}s...`)
      await new Promise((r) => setTimeout(r, esperaMs))
    }
  }
}

async function start() {
  try {
    await conectarDB()
    console.log('[DB] Conectado a MySQL')

    await redis.ping()
    console.log('[Redis] Listo')

    if (process.env.MORA_JOB_ENABLED === 'true') {
      await registrarJobsRecurrentes()
      crearWorkerActividad()
      console.log('[Queues] Jobs recurrentes registrados')
    }

    app.listen(PORT, () => {
      console.log(`[Server] ${process.env.APP_NAME} corriendo en http://localhost:${PORT}`)
      console.log(`[Server] Entorno: ${process.env.NODE_ENV}`)
    })
  } catch (err) {
    console.error('[Server] Error al iniciar:', err.message)
    process.exit(1)
  }
}

// ── Cierre graceful ───────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n[Server] Señal ${signal} recibida. Cerrando...`)
  await prisma.$disconnect()
  await redis.quit()
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('unhandledRejection', (reason) => {
  const mensaje = reason instanceof Error ? reason.message : String(reason)
  console.error('[Server] Unhandled rejection:', mensaje)
  process.exit(1)
})

start()
