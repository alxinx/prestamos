'use strict'

const { listarCapital, obtenerCapital, obtenerEstadisticasCapital, crearCapital, suspenderCapital, reactivarCapital, ajustarCapital } = require('./capital.service')
const { controlar } = require('../../../lib/controlador')

const manejarListar        = controlar(req => listarCapital(req))
const manejarObtener       = controlar(req => obtenerCapital(req))
const manejarEstadisticas  = controlar(req => obtenerEstadisticasCapital(req))
const manejarCrear         = controlar(req => crearCapital(req), { crear: true })
const manejarSuspender     = controlar(req => suspenderCapital(req))
const manejarReactivar     = controlar(req => reactivarCapital(req))
const manejarAjustar       = controlar(req => ajustarCapital(req))

module.exports = { manejarListar, manejarObtener, manejarEstadisticas, manejarCrear, manejarSuspender, manejarReactivar, manejarAjustar }
