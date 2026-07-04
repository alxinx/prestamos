'use strict'

const { obtenerDatosSaas, guardarDatosSaas } = require('./datosSaas.service')
const { controlar } = require('../../lib/controlador')

const manejarObtener = controlar(() => obtenerDatosSaas())
const manejarGuardar = controlar(req => guardarDatosSaas(req.body))

module.exports = { manejarObtener, manejarGuardar }
