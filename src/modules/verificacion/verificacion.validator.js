'use strict'

const { z } = require('zod')

// 64 hex chars = crypto.randomBytes(32).toString('hex'). Nunca es el UUID v7 del
// registro — es un token de verificación aparte, generado solo para este propósito.
const esquemaToken = z.string().length(64, 'Token inválido').regex(/^[0-9a-f]{64}$/, 'Token inválido')

module.exports = { esquemaToken }
