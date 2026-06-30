'use strict'

const { Router } = require('express')
const { authLimiter } = require('../../middleware/rateLimiter')
const { validarLogin } = require('./auth.validator')
const { manejarLogin, manejarRefresh, manejarLogout } = require('./auth.controller')

const router = Router()

router.post('/login', authLimiter, validarLogin, manejarLogin)
router.post('/refresh', manejarRefresh)
router.post('/logout', manejarLogout)

module.exports = router
