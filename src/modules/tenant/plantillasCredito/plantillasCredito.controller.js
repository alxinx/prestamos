'use strict'

const { listarPlantillas, crearPlantilla, editarPlantilla, cambiarEstadoPlantilla, moraPorPlantilla } = require('./plantillasCredito.service')
const { controlar } = require('../../../lib/controlador')

const manejarListar        = controlar(req => listarPlantillas(req))
const manejarCrear         = controlar(req => crearPlantilla(req), { crear: true })
const manejarEditar        = controlar(req => editarPlantilla(req))
const manejarCambiarEstado = controlar(req => cambiarEstadoPlantilla(req))
const manejarMora          = controlar(req => moraPorPlantilla(req))

module.exports = { manejarListar, manejarCrear, manejarEditar, manejarCambiarEstado, manejarMora }
