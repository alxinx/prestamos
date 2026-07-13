'use strict'

const { verificarCedula, crearCliente } = require('./clientes.service')
const { controlar } = require('../../../lib/controlador')

const manejarVerificarCedula = controlar(req => verificarCedula(req))
const manejarCrear           = controlar(req => crearCliente(req), { crear: true })

module.exports = { manejarVerificarCedula, manejarCrear }
