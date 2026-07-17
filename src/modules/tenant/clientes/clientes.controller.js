'use strict'

const { verificarCedula, crearCliente, listarClientes, estadisticasClientes, obtenerDetalleCliente } = require('./clientes.service')
const { controlar } = require('../../../lib/controlador')

const manejarListar         = controlar(req => listarClientes(req))
const manejarEstadisticas   = controlar(req => estadisticasClientes(req))
const manejarVerificarCedula = controlar(req => verificarCedula(req))
const manejarCrear           = controlar(req => crearCliente(req), { crear: true })
const manejarObtenerDetalle  = controlar(req => obtenerDetalleCliente(req))

module.exports = { manejarListar, manejarEstadisticas, manejarVerificarCedula, manejarCrear, manejarObtenerDetalle }
