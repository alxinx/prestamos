'use strict'

const { listarPlantillas, crearPlantilla, moraPorPlantilla } = require('./plantillasCredito.service')
const { controlar } = require('../../../lib/controlador')

const manejarListar = controlar(req => listarPlantillas(req))
const manejarCrear  = controlar(req => crearPlantilla(req), { crear: true })
const manejarMora   = controlar(req => moraPorPlantilla(req))

module.exports = { manejarListar, manejarCrear, manejarMora }
