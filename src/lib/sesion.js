'use strict'

const { v7: uuidv7 } = require('uuid')
const { redis } = require('./redis')
const {
  generarAccessToken,
  generarRefreshToken,
  verificarRefreshToken,
  REFRESH_TTL_SECONDS,
} = require('./jwt')

// Hash bcrypt inválido usado para comparar cuando el usuario no existe —
// evita que la ausencia de bcrypt.compare() delate por timing si el email no existe.
const HASH_FICTICIO = '$2b$12$invalidhashfortimingattackpreventionxxxxxxxxxxxxxxxxxxxxxxx'

function crearControlIntentos(prefijo, { maxIntentos, bloqueoSegundos }) {
  const clave = email => `${prefijo}:login:fallos:${email.toLowerCase()}`

  return {
    async estaBloqueado(email) {
      const intentos = await redis.get(clave(email))
      return intentos !== null && Number(intentos) >= maxIntentos
    },
    async registrarFallo(email) {
      const k = clave(email)
      const intentos = await redis.incr(k)
      if (intentos === 1) await redis.expire(k, bloqueoSegundos)
    },
    async resetearIntentos(email) {
      await redis.del(clave(email))
    },
  }
}

function claveRefresh(prefijo, jti) {
  return `${prefijo}:rt:${jti}`
}

async function emitirTokens({ prefijo, carga, idSujeto }) {
  const jti = uuidv7()
  const accessToken = generarAccessToken(carga)
  const refreshToken = generarRefreshToken({ ...carga, jti })
  await redis.set(claveRefresh(prefijo, jti), idSujeto, 'EX', REFRESH_TTL_SECONDS)
  return { accessToken, refreshToken }
}

// `validarSujeto` es opcional — permite que un módulo (ej. tenant, con su regla
// de `estado` del empleado) rechace la renovación sin que este helper compartido
// conozca esa regla de negocio específica.
async function rotarRefreshToken({ req, cookieNombre, prefijo, construirCarga, validarSujeto }) {
  const token = req.cookies?.[cookieNombre]
  if (!token) return { error: 'Refresh token requerido', status: 401 }

  let carga
  try {
    carga = verificarRefreshToken(token)
  } catch {
    return { error: 'Token inválido o expirado', status: 401 }
  }

  const idSujeto = await redis.get(claveRefresh(prefijo, carga.jti))
  if (!idSujeto) return { error: 'Sesión expirada', status: 401 }

  if (validarSujeto && !(await validarSujeto(idSujeto, carga))) {
    await redis.del(claveRefresh(prefijo, carga.jti))
    return { error: 'Sesión inválida', status: 401 }
  }

  await redis.del(claveRefresh(prefijo, carga.jti))

  return emitirTokens({ prefijo, carga: construirCarga(carga), idSujeto })
}

async function cerrarSesionComun({ req, cookieNombre, prefijo }) {
  const token = req.cookies?.[cookieNombre]
  if (token) {
    try {
      const carga = verificarRefreshToken(token)
      await redis.del(claveRefresh(prefijo, carga.jti))
    } catch {
      // Token ya inválido — igual se limpia la cookie en el controller
    }
  }
}

module.exports = {
  HASH_FICTICIO,
  crearControlIntentos,
  emitirTokens,
  rotarRefreshToken,
  cerrarSesionComun,
}
