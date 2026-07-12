const rateLimit = require('express-rate-limit')

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000

function crearLimiter({ windowMs: ventana = windowMs, max, mensaje, skipSuccessfulRequests }) {
  return rateLimit({
    windowMs: ventana,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: mensaje },
    ...(skipSuccessfulRequests !== undefined && { skipSuccessfulRequests }),
  })
}

// Límite global: cubre TODOS los endpoints — primera línea contra DoS
const globalLimiter = crearLimiter({
  max: Number(process.env.RATE_LIMIT_MAX_GLOBAL) || 300,
  mensaje: 'Demasiadas solicitudes. Intente de nuevo más tarde.',
})

// Rutas de autenticación: login, registro, recuperación de contraseña
const authLimiter = crearLimiter({
  max: Number(process.env.RATE_LIMIT_MAX_AUTH) || 10,
  mensaje: 'Demasiados intentos. Intente de nuevo más tarde.',
  skipSuccessfulRequests: false,
})

// Refresh de token: genera JWTs, debe ser más restringido que el global
const refreshLimiter = crearLimiter({
  max: 30,
  mensaje: 'Demasiados intentos. Intente de nuevo más tarde.',
})

// Generación de OTP de firma: máximo 3 por cliente por hora
const otpLimiter = crearLimiter({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_OTP) || 3,
  mensaje: 'Límite de solicitudes OTP alcanzado. Intente en una hora.',
})

// Verificación pública de documentos (QR de vouchers, GET /api/verificar/:token):
// sin autenticación, el endpoint más expuesto del sistema — límite propio, más
// estricto que el global, no cuenta con `skipSuccessfulRequests` (se cuentan todas
// las peticiones, exitosas o no, para no dejar hueco a enumeración de tokens).
const verificacionLimiter = crearLimiter({
  max: Number(process.env.RATE_LIMIT_MAX_VERIFICACION) || 30,
  mensaje: 'Demasiadas solicitudes. Intente más tarde.',
})

module.exports = { globalLimiter, authLimiter, refreshLimiter, otpLimiter, verificacionLimiter }
