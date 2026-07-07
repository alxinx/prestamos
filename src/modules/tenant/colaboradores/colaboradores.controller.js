'use strict'

const { listarColaboradores, listarRolesDisponibles, crearColaborador, cambiarEstadoColaborador } = require('./colaboradores.service')
const { controlar } = require('../../../lib/controlador')

const manejarListar        = controlar(req => listarColaboradores(req))
const manejarListarRoles   = controlar(req => listarRolesDisponibles(req))
const manejarCrear         = controlar(req => crearColaborador(req), { crear: true })
const manejarCambiarEstado = controlar(req => cambiarEstadoColaborador(req))

module.exports = { manejarListar, manejarListarRoles, manejarCrear, manejarCambiarEstado }
