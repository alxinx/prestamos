'use strict'

const { Router } = require('express')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { controlar } = require('../../../lib/controlador')
const { listarZonas } = require('./zonas.service')

const router = Router()

router.use(authTenant)

router.get('/', requierePermiso('clientes.ver'), controlar(req => listarZonas(req)))

module.exports = router
