'use strict'

const crypto = require('crypto')
const bcrypt = require('bcrypt')
const { v7: uuidv7 } = require('uuid')
const prisma = require('../../lib/prisma')
const { redis } = require('../../lib/redis')
const { enviarEmail } = require('../../lib/email')
const { emailRecuperacionContrasena } = require('../../emails/recuperacionContrasena')
const {
  generarAccessToken,
  generarRefreshToken,
  verificarRefreshToken,
  REFRESH_TTL_SECONDS,
} = require('../../lib/jwt')

const HASH_FICTICIO   = '$2b$12$invalidhashfortimingattackpreventionxxxxxxxxxxxxxxxxxxxxxxx'
const COOKIE_REFRESH  = 't_refresh'

const MAX_INTENTOS    = Number(process.env.LOGIN_MAX_INTENTOS_EMAIL) || 5
const BLOQUEO_SEG     = Number(process.env.LOGIN_BLOQUEO_SEGUNDOS)   || 15 * 60

const ESTADOS_TENANT_PERMITIDOS = ['ACTIVO', 'PERIODO_GRACIA']

function claveIntentos(email) {
  return `tenant:login:fallos:${email.toLowerCase()}`
}

function claveRefresh(jti) {
  return `tenant:rt:${jti}`
}

async function estaBloquedo(email) {
  const intentos = await redis.get(claveIntentos(email))
  return intentos !== null && Number(intentos) >= MAX_INTENTOS
}

async function registrarFallo(email) {
  const clave = claveIntentos(email)
  const intentos = await redis.incr(clave)
  if (intentos === 1) await redis.expire(clave, BLOQUEO_SEG)
}

async function resetearIntentos(email) {
  await redis.del(claveIntentos(email))
}

async function iniciarSesion(req) {
  const { email, password } = req.body

  if (await estaBloquedo(email)) {
    return { error: 'Demasiados intentos fallidos. Intente de nuevo más tarde.', status: 429 }
  }

  const empleado = await prisma.empleado.findFirst({
    where: { email: email.toLowerCase().trim(), estado: 'ACTIVO' },
    include: { rol: { select: { nombre: true } } },
  })

  const hashAComparar = empleado ? empleado.passwordHash : HASH_FICTICIO
  const contrasenaValida = await bcrypt.compare(password, hashAComparar)

  if (!empleado || !contrasenaValida) {
    await registrarFallo(email)
    return { error: 'Credenciales inválidas', status: 401 }
  }

  // Verificar que el tenant esté activo
  const tenant = await prisma.tenant.findUnique({
    where: { id: empleado.tenantId },
    select: { id: true, estado: true, nombreNegocio: true },
  })

  if (!tenant || !ESTADOS_TENANT_PERMITIDOS.includes(tenant.estado)) {
    return { error: 'Tu cuenta está suspendida. Contacta al administrador.', status: 403 }
  }

  await resetearIntentos(email)

  const jti = uuidv7()
  const cargaToken = {
    sub:         empleado.id,
    tenantId:    empleado.tenantId,
    role:        empleado.rol.nombre,
    esSuperAdmin: empleado.esSuperAdmin,
  }

  const accessToken  = generarAccessToken(cargaToken)
  const refreshToken = generarRefreshToken({ ...cargaToken, jti })

  await redis.set(claveRefresh(jti), empleado.id, 'EX', REFRESH_TTL_SECONDS)

  prisma.empleado
    .update({ where: { id: empleado.id }, data: { updatedAt: new Date() } })
    .catch(() => {})

  return { accessToken, refreshToken, nombreCookie: COOKIE_REFRESH }
}

async function renovarToken(req) {
  const token = req.cookies?.[COOKIE_REFRESH]
  if (!token) return { error: 'Refresh token requerido', status: 401 }

  let carga
  try {
    carga = verificarRefreshToken(token)
  } catch {
    return { error: 'Token inválido o expirado', status: 401 }
  }

  const idEmpleado = await redis.get(claveRefresh(carga.jti))
  if (!idEmpleado) return { error: 'Sesión expirada', status: 401 }

  await redis.del(claveRefresh(carga.jti))

  const nuevoJti    = uuidv7()
  const nuevaCarga  = { sub: carga.sub, tenantId: carga.tenantId, role: carga.role, esSuperAdmin: carga.esSuperAdmin }
  const accessToken = generarAccessToken(nuevaCarga)
  const refreshToken = generarRefreshToken({ ...nuevaCarga, jti: nuevoJti })

  await redis.set(claveRefresh(nuevoJti), idEmpleado, 'EX', REFRESH_TTL_SECONDS)

  return { accessToken, refreshToken, nombreCookie: COOKIE_REFRESH }
}

async function cerrarSesion(req) {
  const token = req.cookies?.[COOKIE_REFRESH]
  if (token) {
    try {
      const carga = verificarRefreshToken(token)
      await redis.del(claveRefresh(carga.jti))
    } catch { /* token ya inválido */ }
  }
  return { nombreCookie: COOKIE_REFRESH }
}

const RESET_TTL_SEG = 60 * 60 // 1 hora

function claveReset(token) {
  return `tenant:reset:${token}`
}

async function solicitarRecuperacion({ email }) {
  const empleado = await prisma.empleado.findFirst({
    where: { email: email.toLowerCase().trim(), estado: 'ACTIVO' },
  })

  // Siempre la misma respuesta — no revelar si el email existe
  if (!empleado) return { ok: true }

  const token = crypto.randomBytes(32).toString('hex')
  await redis.set(claveReset(token), empleado.id, 'EX', RESET_TTL_SEG)

  const urlReset = `${process.env.APP_URL}/restablecer-contrasena?token=${token}`
  const html = emailRecuperacionContrasena({ nombreCompleto: empleado.nombreCompleto, urlReset })

  enviarEmail({ destinatario: empleado.email, asunto: 'Recupera tu contraseña — GotaPay', html })
    .catch(err => console.error('[Email] Error recuperación:', err.message))

  return { ok: true }
}

async function restablecerContrasena({ token, password }) {
  const empleadoId = await redis.get(claveReset(token))
  if (!empleadoId) return { error: 'El enlace expiró o ya fue utilizado.', status: 400 }

  const nuevoHash = await bcrypt.hash(password, 12)

  await prisma.empleado.update({
    where: { id: empleadoId },
    data:  { passwordHash: nuevoHash },
  })

  await redis.del(claveReset(token))

  return { ok: true }
}

async function obtenerPerfil(req) {
  const { id: empleadoId, tenantId } = req.empleado

  const empleado = await prisma.empleado.findFirst({
    where: { id: empleadoId, tenantId },
    select: {
      id:            true,
      nombreCompleto: true,
      email:         true,
      esSuperAdmin:  true,
      rol:           { select: { nombre: true } },
      tenant:        { select: { nombreNegocio: true } },
    },
  })

  if (!empleado) return { error: 'Empleado no encontrado', status: 404 }

  return {
    id:             empleado.id,
    nombreCompleto: empleado.nombreCompleto,
    email:          empleado.email,
    rol:            empleado.rol.nombre,
    esSuperAdmin:   empleado.esSuperAdmin,
    nombreNegocio:  empleado.tenant.nombreNegocio,
  }
}

module.exports = { iniciarSesion, renovarToken, cerrarSesion, solicitarRecuperacion, restablecerContrasena, obtenerPerfil }
