'use strict'

const { verificarAccessToken } = require('../lib/jwt')

const ROLES_TENANT = ['ADMINISTRADOR', 'COBRADOR', 'SECRETARIA', 'AUDITOR']

function authTenant(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acceso requerido' })
  }

  const token = header.slice(7)
  try {
    const payload = verificarAccessToken(token)

    if (!payload.tenantId || !ROLES_TENANT.includes(payload.role)) {
      return res.status(403).json({ error: 'Acceso denegado' })
    }

    req.empleado = {
      id:          payload.sub,
      tenantId:    payload.tenantId,
      role:        payload.role,
      esSuperAdmin: payload.esSuperAdmin,
    }
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

module.exports = authTenant
