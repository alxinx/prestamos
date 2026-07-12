'use strict'

const { Router } = require('express')
const slowDown = require('express-slow-down')
const { verificacionLimiter } = require('../../middleware/rateLimiter')
const { esquemaToken } = require('./verificacion.validator')
const { verificarDocumento } = require('./verificacion.service')

// Capa 3 — slowdown progresivo: sin delay en las primeras 10 peticiones de la
// ventana, +200ms por cada una adicional, tope de 5s. Se suma al límite duro de
// verificacionLimiter (capa 1) y al globalLimiter ya montado en /api (capa 2).
// Helmet (capa 4) ya está activo para toda la app desde index.js.
const verificacionSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 10,
  delayMs: used => (used - 10) * 200,
  maxDelayMs: 5000,
})

const router = Router()

// Sin authTenant/authMasterAdmin — ruta pública a propósito (se escanea desde un
// QR en un voucher impreso). Por eso no usa el helper `controlar()` compartido:
// necesita cabeceras propias y la garantía explícita de que CUALQUIER fallo
// (formato inválido, token inexistente, error de DB) responde exactamente igual,
// 404 genérico, para no filtrar el formato esperado del token ni distinguir
// "no existe" de "error interno".
router.get('/:token', verificacionSlowDown, verificacionLimiter, async (req, res) => {
  try {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
    })

    const resultado = esquemaToken.safeParse(req.params.token)
    if (!resultado.success) return res.status(404).json({ error: 'Documento no encontrado' })

    const datos = await verificarDocumento(resultado.data)
    if (datos.error) return res.status(datos.status).json({ error: datos.error })
    return res.status(200).json(datos)
  } catch (err) {
    console.error('[Verificación] Error interno:', err.message)
    return res.status(404).json({ error: 'Documento no encontrado' })
  }
})

module.exports = router
