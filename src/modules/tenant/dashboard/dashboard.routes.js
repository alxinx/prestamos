'use strict'

const { Router } = require('express')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { manejarCreditosActivos, manejarCarteraEnMora } = require('./dashboard.controller')

const router = Router()

router.use(authTenant)

router.get('/creditos-activos', requierePermiso('creditos.ver'), manejarCreditosActivos)
router.get('/cartera-en-mora', requierePermiso('creditos.ver'), manejarCarteraEnMora)

module.exports = router
