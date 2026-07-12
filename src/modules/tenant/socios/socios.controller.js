'use strict'

const { listarSocios, crearSocio, suspenderSocio, reactivarSocio } = require('./socios.service')
const { controlar } = require('../../../lib/controlador')

const manejarListar    = controlar(req => listarSocios(req))
const manejarCrear     = controlar(req => crearSocio(req), { crear: true })
const manejarSuspender = controlar(req => suspenderSocio(req))
const manejarReactivar = controlar(req => reactivarSocio(req))

module.exports = { manejarListar, manejarCrear, manejarSuspender, manejarReactivar }
