'use strict'

const crypto = require('crypto')

// Token de verificación pública para vouchers impresos (QR -> GET /api/verificar/:token).
// 64 hex chars (32 bytes), nunca es el UUID v7 del registro — ver CLAUDE.md §9/§verificar.
function generarTokenVerificacion() {
  return crypto.randomBytes(32).toString('hex')
}

module.exports = { generarTokenVerificacion }
