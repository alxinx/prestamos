'use strict'

const { verificarAccessToken } = require('../lib/jwt')

const ROLES_TENANT = ['ADMINISTRADOR', 'COBRADOR', 'SECRETARIA', 'AUDITOR']

function authTenant(req, res, next) {
  const token = req.cookies?.['t_access']
  if (!token) return res.status(401).json({ error: 'Sesión requerida' })

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
    return res.status(401).json({ error: 'Sesión expirada' })
  }
}

module.exports = authTenant
