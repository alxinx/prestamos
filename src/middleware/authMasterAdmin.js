'use strict'

const { verificarAccessToken } = require('../lib/jwt')

function authMasterAdmin(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acceso requerido' })
  }

  const token = header.slice(7)
  try {
    const payload = verificarAccessToken(token)
    if (payload.role !== 'MASTER_ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado' })
    }
    req.masterAdmin = { id: payload.sub }
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

module.exports = authMasterAdmin
