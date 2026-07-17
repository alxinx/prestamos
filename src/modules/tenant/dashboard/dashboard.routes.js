'use strict'

const { Router } = require('express')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { manejarCreditosActivos } = require('./dashboard.controller')

const router = Router()

router.use(authTenant)

router.get('/creditos-activos', requierePermiso('creditos.ver'), manejarCreditosActivos)

module.exports = router
