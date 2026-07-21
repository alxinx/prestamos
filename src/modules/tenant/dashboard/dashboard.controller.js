'use strict'

const { creditosActivosResumen, carteraEnMoraResumen } = require('./dashboard.service')
const { controlar } = require('../../../lib/controlador')

const manejarCreditosActivos = controlar(req => creditosActivosResumen(req))
const manejarCarteraEnMora = controlar(req => carteraEnMoraResumen(req))

module.exports = { manejarCreditosActivos, manejarCarteraEnMora }
