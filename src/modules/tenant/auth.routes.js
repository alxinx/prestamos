'use strict'

const { Router } = require('express')
const { authLimiter, refreshLimiter } = require('../../middleware/rateLimiter')
const { validarLogin, validarSolicitarRecuperacion, validarRestablecerContrasena } = require('./auth.validator')
const authTenant = require('../../middleware/authTenant')
const { manejarLogin, manejarRefresh, manejarLogout, manejarSolicitarRecuperacion, manejarRestablecerContrasena, manejarMe } = require('./auth.controller')

const router = Router()

router.post('/login',              authLimiter,    validarLogin,                  manejarLogin)
router.post('/refresh',            refreshLimiter, manejarRefresh)
router.post('/logout',             manejarLogout)
router.post('/recuperar',          authLimiter,    validarSolicitarRecuperacion,   manejarSolicitarRecuperacion)
router.post('/restablecer',        authLimiter,    validarRestablecerContrasena,   manejarRestablecerContrasena)
router.get('/me',                  authTenant,                                    manejarMe)

module.exports = router
