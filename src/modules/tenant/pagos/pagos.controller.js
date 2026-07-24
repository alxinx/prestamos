'use strict'

const { simularPago, registrarPago, liquidarPago, listarPagosCredito, regenerarVoucherPago } = require('./pagos.service')
const { controlar } = require('../../../lib/controlador')

const manejarSimular = controlar(req => simularPago(req))
const manejarRegistrar = controlar(req => registrarPago(req), { crear: true })
const manejarLiquidar = controlar(req => liquidarPago(req))
const manejarListarPorCredito = controlar(req => listarPagosCredito(req))
const manejarVoucher = controlar(req => regenerarVoucherPago(req))

module.exports = { manejarSimular, manejarRegistrar, manejarLiquidar, manejarListarPorCredito, manejarVoucher }
