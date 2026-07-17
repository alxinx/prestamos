'use strict'

const { creditosActivosResumen } = require('./dashboard.service')
const { controlar } = require('../../../lib/controlador')

const manejarCreditosActivos = controlar(req => creditosActivosResumen(req))

module.exports = { manejarCreditosActivos }
