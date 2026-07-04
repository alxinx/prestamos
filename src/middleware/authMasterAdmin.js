'use strict'

const { verificarAccessToken } = require('../lib/jwt')

function authMasterAdmin(req, res, next) {
  const token = req.cookies?.['ma_access']
  if (!token) return res.status(401).json({ error: 'Sesión requerida' })

  try {
    const payload = verificarAccessToken(token)
    if (payload.role !== 'MASTER_ADMIN') {
      return res.status(403).json({ error: 'Acceso denegado' })
    }
    req.masterAdmin = { id: payload.sub }
    next()
  } catch {
    return res.status(401).json({ error: 'Sesión expirada' })
  }
}

module.exports = authMasterAdmin
