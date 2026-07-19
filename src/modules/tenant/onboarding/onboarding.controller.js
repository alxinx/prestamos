'use strict'

const { estadoOnboarding, finalizarOnboarding } = require('./onboarding.service')
const { controlar } = require('../../../lib/controlador')

const manejarEstado = controlar(req => estadoOnboarding(req))
const manejarFinalizar = controlar(req => finalizarOnboarding(req))

module.exports = { manejarEstado, manejarFinalizar }
