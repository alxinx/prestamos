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
const healthRouter = require('./src/routes/health')
const masterAdminAuthRouter = require('./src/modules/masterAdmin/auth.routes')

const app = express()
const PORT = Number(process.env.APP_PORT) || 3000

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

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api', healthRouter)
app.use('/api/master-admin/auth', masterAdminAuthRouter)

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
  console.error('[Server] Unhandled rejection:', reason)
  process.exit(1)
})

start()
