'use strict'

const { Router } = require('express')
const authTenant = require('../../../middleware/authTenant')
const requierePermiso = require('../../../middleware/requierePermiso')
const { validarRegistrarPago } = require('./pagos.validator')
const { manejarSimular, manejarRegistrar, manejarLiquidar, manejarListarPorCredito, manejarVoucher } = require('./pagos.controller')

const router = Router()

router.use(authTenant)

router.post('/simular',             requierePermiso('cobros.ver'),       manejarSimular)
router.get('/credito/:creditoId',   requierePermiso('cobros.ver'),       manejarListarPorCredito)
router.post('/',                    requierePermiso('cobros.registrar'), validarRegistrarPago, manejarRegistrar)
router.post('/:id/liquidar',        requierePermiso('cobros.liquidar'),  manejarLiquidar)
router.get('/:id/voucher',          requierePermiso('cobros.ver'),       manejarVoucher)

module.exports = router
