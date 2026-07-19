'use strict'

const bcrypt = require('bcrypt')
const prisma = require('../../lib/prisma')
const { HASH_FICTICIO, crearControlIntentos, emitirTokens, rotarRefreshToken, cerrarSesionComun } = require('../../lib/sesion')

const COOKIE_REFRESH = 'ma_refresh'
const PREFIJO = 'masterAdmin'

const MAX_INTENTOS_EMAIL  = Number(process.env.LOGIN_MAX_INTENTOS_EMAIL) || 5
const BLOQUEO_SEGUNDOS    = Number(process.env.LOGIN_BLOQUEO_SEGUNDOS)   || 15 * 60

const { estaBloqueado: estaBloqueadoPorEmail, registrarFallo, resetearIntentos } =
  crearControlIntentos(PREFIJO, { maxIntentos: MAX_INTENTOS_EMAIL, bloqueoSegundos: BLOQUEO_SEGUNDOS })

// req.ip ya respeta `trust proxy` (ver index.js) — nunca leer X-Forwarded-For
// a mano acá: el cliente lo controla por completo y permitiría evadir el
// whitelist de IP con un header falsificado si no hay un proxy confiable real.
function extraerIp(req) {
  return req.ip.replace(/^::ffff:/, '')
}

async function iniciarSesion(req) {
  const { email, password } = req.body
  const ip = extraerIp(req)

  // Bloqueo por cuenta: independiente de la IP de origen
  if (await estaBloqueadoPorEmail(email)) {
    return { error: 'Demasiados intentos fallidos. Intente de nuevo más tarde.', status: 429 }
  }

  const admin = await prisma.masterAdmin.findUnique({ where: { email } })

  // Siempre correr bcrypt para evitar timing attacks por enumeración de usuarios
  const hashAComparar = admin ? admin.passwordHash : HASH_FICTICIO
  const contrasenaValida = await bcrypt.compare(password, hashAComparar)

  if (!admin || !contrasenaValida) {
    await registrarFallo(email)
    return { error: 'Credenciales inválidas', status: 401 }
  }

  const ipsPermitidas = Array.isArray(admin.ipWhitelist)
    ? admin.ipWhitelist
    : JSON.parse(admin.ipWhitelist)

  if (!ipsPermitidas.includes(ip)) {
    return { error: 'Acceso no autorizado desde esta IP', status: 403 }
  }

  // Login exitoso: limpiar contador de fallos
  await resetearIntentos(email)

  const { accessToken, refreshToken } = await emitirTokens({
    prefijo: PREFIJO,
    carga: { sub: admin.id, role: 'MASTER_ADMIN' },
    idSujeto: admin.id,
  })

  prisma.masterAdmin
    .update({ where: { id: admin.id }, data: { ultimoAcceso: new Date() } })
    .catch(() => {})

  return { accessToken, refreshToken, nombreCookie: COOKIE_REFRESH }
}

async function renovarToken(req) {
  const resultado = await rotarRefreshToken({
    req,
    cookieNombre: COOKIE_REFRESH,
    prefijo: PREFIJO,
    construirCarga: carga => ({ sub: carga.sub, role: 'MASTER_ADMIN' }),
  })
  if (resultado.error) return resultado
  return { ...resultado, nombreCookie: COOKIE_REFRESH }
}

async function cerrarSesion(req) {
  await cerrarSesionComun({ req, cookieNombre: COOKIE_REFRESH, prefijo: PREFIJO })
  return { nombreCookie: COOKIE_REFRESH }
}

async function cambiarPassword(req) {
  const { contrasenaActual, nuevaContrasena } = req.body
  const adminId = req.masterAdmin.id

  const admin = await prisma.masterAdmin.findUnique({ where: { id: adminId } })
  if (!admin) return { error: 'Administrador no encontrado', status: 404 }

  const contrasenaValida = await bcrypt.compare(contrasenaActual, admin.passwordHash)
  if (!contrasenaValida) return { error: 'La contraseña actual es incorrecta', status: 401 }

  const nuevoHash = await bcrypt.hash(nuevaContrasena, 12)
  await prisma.masterAdmin.update({
    where: { id: adminId },
    data: { passwordHash: nuevoHash },
  })

  return { ok: true }
}

module.exports = { iniciarSesion, renovarToken, cerrarSesion, cambiarPassword }
