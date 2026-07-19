'use strict'

const { listarPlanes, obtenerPlan, crearPlan, actualizarPlan, cambiarEstadoPlan, actualizarConfigPlan } = require('./planes.service')
const { controlar } = require('../../lib/controlador')

const manejarListar           = controlar(() => listarPlanes())
const manejarObtener          = controlar(req => obtenerPlan(req.params.id))
const manejarCrear            = controlar(req => crearPlan(req.body, req.masterAdmin.id), { crear: true })
const manejarActualizar       = controlar(req => actualizarPlan(req.params.id, req.body, req.masterAdmin.id))
const manejarCambiarEstado    = controlar(req => cambiarEstadoPlan(req.params.id, req.masterAdmin.id))
const manejarActualizarConfig = controlar(req => actualizarConfigPlan(req.params.id, req.body, req.masterAdmin.id))

module.exports = { manejarListar, manejarObtener, manejarCrear, manejarActualizar, manejarCambiarEstado, manejarActualizarConfig }
