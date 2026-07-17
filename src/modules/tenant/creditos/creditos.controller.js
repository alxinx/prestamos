'use strict'

const { estadisticasCreditos, creditosEnMora, listarCreditos, simularCredito, crearCredito } = require('./creditos.service')
const { controlar } = require('../../../lib/controlador')

const manejarEstadisticas = controlar(req => estadisticasCreditos(req))
const manejarMora         = controlar(req => creditosEnMora(req))
const manejarListar       = controlar(req => listarCreditos(req))
const manejarSimular      = controlar(req => simularCredito(req))
const manejarCrear        = controlar(req => crearCredito(req), { crear: true })

module.exports = { manejarEstadisticas, manejarMora, manejarListar, manejarSimular, manejarCrear }
