const rateLimit = require('express-rate-limit')

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000

// Rutas de autenticación: login, registro, recuperación de contraseña
const authLimiter = rateLimit({
  windowMs,
  max: Number(process.env.RATE_LIMIT_MAX_AUTH) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Mensaje genérico: nunca revelar si el usuario existe
  message: { error: 'Demasiados intentos. Intente de nuevo más tarde.' },
  skipSuccessfulRequests: false,
})

// Generación de OTP de firma: máximo 3 por cliente por hora
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_OTP) || 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de solicitudes OTP alcanzado. Intente en una hora.' },
})

module.exports = { authLimiter, otpLimiter }
