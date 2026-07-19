'use strict'

const { limitePrestamos, limiteColaboradores, opciones } = require('./plan.service')
const { controlar } = require('../../../lib/controlador')

const manejarLimitePrestamos = controlar(req => limitePrestamos(req))
const manejarLimiteColaboradores = controlar(req => limiteColaboradores(req))
const manejarOpciones = controlar(req => opciones(req))

module.exports = { manejarLimitePrestamos, manejarLimiteColaboradores, manejarOpciones }
