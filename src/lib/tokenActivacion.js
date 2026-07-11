'use strict'

const crypto = require('crypto')

const EXPIRACION_TOKEN_ACTIVACION_MS = 72 * 60 * 60 * 1000

function generarTokenActivacion() {
  return crypto.randomBytes(32).toString('hex')
}

function calcularExpiracionActivacion() {
  return new Date(Date.now() + EXPIRACION_TOKEN_ACTIVACION_MS)
}

module.exports = { EXPIRACION_TOKEN_ACTIVACION_MS, generarTokenActivacion, calcularExpiracionActivacion }
