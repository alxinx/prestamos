'use strict'

const { Router } = require('express')
const { authLimiter, refreshLimiter } = require('../../middleware/rateLimiter')
const authMasterAdmin = require('../../middleware/authMasterAdmin')
const { validarLogin, validarCambioPassword } = require('./auth.validator')
const { manejarLogin, manejarRefresh, manejarLogout, manejarCambioPassword } = require('./auth.controller')

const router = Router()

router.post('/login', authLimiter, validarLogin, manejarLogin)
router.post('/refresh', refreshLimiter, manejarRefresh)
router.post('/logout', manejarLogout)
router.post('/cambiar-password', authMasterAdmin, validarCambioPassword, manejarCambioPassword)

module.exports = router
