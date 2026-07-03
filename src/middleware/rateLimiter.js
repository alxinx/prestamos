const rateLimit = require('express-rate-limit')

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000

// Límite global: cubre TODOS los endpoints — primera línea contra DoS
const globalLimiter = rateLimit({
  windowMs,
  max: Number(process.env.RATE_LIMIT_MAX_GLOBAL) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intente de nuevo más tarde.' },
})

// Rutas de autenticación: login, registro, recuperación de contraseña
const authLimiter = rateLimit({
  windowMs,
  max: Number(process.env.RATE_LIMIT_MAX_AUTH) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intente de nuevo más tarde.' },
  skipSuccessfulRequests: false,
})

// Refresh de token: genera JWTs, debe ser más restringido que el global
const refreshLimiter = rateLimit({
  windowMs,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intente de nuevo más tarde.' },
})

// Generación de OTP de firma: máximo 3 por cliente por hora
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_OTP) || 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de solicitudes OTP alcanzado. Intente en una hora.' },
})

module.exports = { globalLimiter, authLimiter, refreshLimiter, otpLimiter }
