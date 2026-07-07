'use strict'

const { resolverPermisosEmpleado } = require('../modules/tenant/permisos/permisos.service')

// Middleware de autorización granular. Usar después de `authTenant` en rutas
// que requieran un permiso específico del catálogo, ej:
//   router.post('/creditos', authTenant, requierePermiso('creditos.crear'), manejarCrear)
function requierePermiso(codigo) {
  return async function (req, res, next) {
    try {
      if (req.empleado?.esSuperAdmin) return next()

      if (!req.permisosEmpleado) {
        req.permisosEmpleado = await resolverPermisosEmpleado({
          tenantId: req.empleado.tenantId,
          empleadoId: req.empleado.id,
        })
      }

      if (req.permisosEmpleado === null || req.permisosEmpleado.has(codigo)) return next()

      return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = requierePermiso
