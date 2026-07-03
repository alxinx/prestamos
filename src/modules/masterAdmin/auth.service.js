'use strict'

const bcrypt = require('bcrypt')
const { v7: uuidv7 } = require('uuid')
const prisma = require('../../lib/prisma')
const { redis } = require('../../lib/redis')
const {
  generarAccessToken,
  generarRefreshToken,
  verificarRefreshToken,
  REFRESH_TTL_SECONDS,
} = require('../../lib/jwt')

const HASH_FICTICIO = '$2b$12$invalidhashfortimingattackpreventionxxxxxxxxxxxxxxxxxxxxxxx'
const COOKIE_REFRESH = 'ma_refresh'

function extraerIp(req) {
  const reenviada = req.headers['x-forwarded-for']
  const cruda = reenviada ? reenviada.split(',')[0].trim() : req.ip
  return cruda.replace(/^::ffff:/, '')
}

function claveRefresh(jti) {
  return `masterAdmin:rt:${jti}`
}

async function iniciarSesion(req) {
  const { email, password } = req.body
  const ip = extraerIp(req)

  const admin = await prisma.masterAdmin.findUnique({ where: { email } })

  // Siempre correr bcrypt para evitar timing attacks por enumeración de usuarios
  const hashAComparar = admin ? admin.passwordHash : HASH_FICTICIO
  const contrasenaValida = await bcrypt.compare(password, hashAComparar)

  if (!admin || !contrasenaValida) {
    return { error: 'Credenciales inválidas', status: 401 }
  }

  const ipsPermitidas = Array.isArray(admin.ipWhitelist)
    ? admin.ipWhitelist
    : JSON.parse(admin.ipWhitelist)

  if (!ipsPermitidas.includes(ip)) {
    return { error: 'Acceso no autorizado desde esta IP', status: 403 }
  }

  const jti = uuidv7()
  const cargaToken = { sub: admin.id, role: 'MASTER_ADMIN' }
  const accessToken = generarAccessToken(cargaToken)
  const refreshToken = generarRefreshToken({ ...cargaToken, jti })

  await redis.set(claveRefresh(jti), admin.id, 'EX', REFRESH_TTL_SECONDS)

  prisma.masterAdmin
    .update({ where: { id: admin.id }, data: { ultimoAcceso: new Date() } })
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

  const idAdmin = await redis.get(claveRefresh(carga.jti))
  if (!idAdmin) return { error: 'Sesión expirada', status: 401 }

  // Rotar: eliminar jti anterior y emitir uno nuevo
  await redis.del(claveRefresh(carga.jti))

  const nuevoJti = uuidv7()
  const nuevaCarga = { sub: carga.sub, role: 'MASTER_ADMIN' }
  const accessToken = generarAccessToken(nuevaCarga)
  const refreshToken = generarRefreshToken({ ...nuevaCarga, jti: nuevoJti })

  await redis.set(claveRefresh(nuevoJti), idAdmin, 'EX', REFRESH_TTL_SECONDS)

  return { accessToken, refreshToken, nombreCookie: COOKIE_REFRESH }
}

async function cerrarSesion(req) {
  const token = req.cookies?.[COOKIE_REFRESH]
  if (token) {
    try {
      const carga = verificarRefreshToken(token)
      await redis.del(claveRefresh(carga.jti))
    } catch {
      // Token ya inválido — igual limpiar la cookie
    }
  }
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
