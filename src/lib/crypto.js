'use strict'

const crypto = require('crypto')

// Cifrado simétrico para campos sensibles de integraciones (apiKey, apiSecret
// de Nequi, Daviplata, etc. — CLAUDE.md §6): "se cifran con AES-256-GCM en el
// backend antes de persistir. Nunca llegan en texto plano a la base de datos."
// Única fuente de verdad para esta operación — cualquier servicio que guarde
// un campo marcado "AES-256-GCM encrypted" en el schema (ConfiguracionOperativa
// .apiKey/.apiSecret, Empleado.dosFASecreto) debe pasar por acá, nunca escribir
// el valor crudo directamente.
const ALGORITMO = 'aes-256-gcm'
const IV_LENGTH = Number(process.env.AES_IV_LENGTH) || 16

function clave() {
  const hex = process.env.AES_SECRET_KEY
  if (!hex) throw new Error('AES_SECRET_KEY no está configurada — no se puede cifrar/descifrar. Generar con: openssl rand -hex 32')
  const buffer = Buffer.from(hex, 'hex')
  if (buffer.length !== 32) throw new Error('AES_SECRET_KEY debe ser una clave hex de 32 bytes (64 caracteres) para AES-256.')
  return buffer
}

// Formato de salida: "iv:authTag:cifrado" en hex, para poder guardarlo como
// un único String en la base de datos sin columnas adicionales.
function cifrar(textoPlano) {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITMO, clave(), iv)
  const cifrado = Buffer.concat([cipher.update(String(textoPlano), 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('hex'), authTag.toString('hex'), cifrado.toString('hex')].join(':')
}

function descifrar(valorCifrado) {
  const [ivHex, authTagHex, cifradoHex] = String(valorCifrado).split(':')
  if (!ivHex || !authTagHex || !cifradoHex) throw new Error('Valor cifrado con formato inválido.')

  const decipher = crypto.createDecipheriv(ALGORITMO, clave(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
  const descifrado = Buffer.concat([decipher.update(Buffer.from(cifradoHex, 'hex')), decipher.final()])
  return descifrado.toString('utf8')
}

module.exports = { cifrar, descifrar }
