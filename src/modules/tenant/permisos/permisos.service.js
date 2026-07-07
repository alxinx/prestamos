'use strict'

const prisma = require('../../../lib/prisma')

// Resuelve el conjunto de códigos de permiso activos para un empleado.
// Regla de negocio: el ajuste individual del empleado (EmpleadoPermiso) tiene
// prioridad; si no existe un ajuste para un permiso, se usa el permiso base
// definido para su rol (RolPermiso). Lo que no está mencionado en ninguna de
// las dos tablas se considera denegado (fail-closed).
//
// Devuelve `null` como señal de "acceso total" cuando el empleado es super admin.
async function resolverPermisosEmpleado({ tenantId, empleadoId }) {
  const empleado = await prisma.empleado.findFirst({
    where: { id: empleadoId, tenantId },
    select: { rolId: true, esSuperAdmin: true },
  })

  if (!empleado) return new Set()
  if (empleado.esSuperAdmin) return null

  const [permisosRol, permisosEmpleado] = await Promise.all([
    prisma.rolPermiso.findMany({
      where: { tenantId, rolId: empleado.rolId },
      select: { activo: true, permisoCatalogo: { select: { codigo: true } } },
    }),
    prisma.empleadoPermiso.findMany({
      where: { tenantId, empleadoId },
      select: { activo: true, permisoCatalogo: { select: { codigo: true } } },
    }),
  ])

  const efectivos = new Map()
  for (const p of permisosRol) efectivos.set(p.permisoCatalogo.codigo, p.activo)
  for (const p of permisosEmpleado) efectivos.set(p.permisoCatalogo.codigo, p.activo)

  return new Set([...efectivos].filter(([, activo]) => activo).map(([codigo]) => codigo))
}

async function obtenerMisPermisos(req) {
  const { id: empleadoId, tenantId } = req.empleado
  const permisos = await resolverPermisosEmpleado({ tenantId, empleadoId })

  if (permisos === null) {
    const catalogo = await prisma.permisoCatalogo.findMany({ select: { codigo: true } })
    return { permisos: catalogo.map(p => p.codigo), esSuperAdmin: true }
  }

  return { permisos: [...permisos], esSuperAdmin: false }
}

module.exports = { resolverPermisosEmpleado, obtenerMisPermisos }
