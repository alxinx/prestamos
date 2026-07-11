'use strict'

const { v7: uuidv7 } = require('uuid')
const prisma = require('../../../lib/prisma')
const { registrarAuditoria } = require('../../../lib/auditoria')
const { publicarCambioPermisos } = require('../../../lib/eventosEmpleado')

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

// Detalle de permisos de un empleado específico para la pantalla de edición del
// administrador — catálogo completo con el valor efectivo (rol + ajuste individual)
// y si ese valor viene de un ajuste individual (para mostrarlo distinto en la UI).
async function obtenerPermisosDetalleEmpleado(req) {
  const { tenantId } = req.empleado
  const { id: empleadoId } = req.params

  const empleado = await prisma.empleado.findFirst({ where: { id: empleadoId, tenantId }, select: { rolId: true, esSuperAdmin: true } })
  if (!empleado) return { error: 'Colaborador no encontrado', status: 404 }

  const [catalogo, permisosRol, permisosEmpleado] = await Promise.all([
    prisma.permisoCatalogo.findMany({ orderBy: [{ modulo: 'asc' }, { nombre: 'asc' }] }),
    prisma.rolPermiso.findMany({
      where: { tenantId, rolId: empleado.rolId },
      select: { activo: true, permisoCatalogoId: true },
    }),
    prisma.empleadoPermiso.findMany({
      where: { tenantId, empleadoId },
      select: { activo: true, permisoCatalogoId: true },
    }),
  ])

  const activoPorRol = new Map(permisosRol.map(p => [p.permisoCatalogoId, p.activo]))
  const activoIndividual = new Map(permisosEmpleado.map(p => [p.permisoCatalogoId, p.activo]))

  const permisos = catalogo.map(p => ({
    codigo: p.codigo,
    nombre: p.nombre,
    descripcion: p.descripcion,
    modulo: p.modulo,
    activo: empleado.esSuperAdmin || (activoIndividual.get(p.id) ?? activoPorRol.get(p.id) ?? false),
    esIndividual: activoIndividual.has(p.id),
  }))

  return { permisos, esSuperAdmin: empleado.esSuperAdmin }
}

async function actualizarPermisosEmpleado(req) {
  const { tenantId, id: autorId } = req.empleado
  const { id: empleadoId } = req.params
  const { permisos } = req.body

  const empleado = await prisma.empleado.findFirst({ where: { id: empleadoId, tenantId } })
  if (!empleado) return { error: 'Colaborador no encontrado', status: 404 }
  if (empleado.esSuperAdmin) return { error: 'El super admin siempre tiene todos los permisos', status: 403 }

  const catalogo = await prisma.permisoCatalogo.findMany({ where: { codigo: { in: permisos.map(p => p.codigo) } } })
  const catalogoPorCodigo = new Map(catalogo.map(p => [p.codigo, p]))

  const existentes = await prisma.empleadoPermiso.findMany({
    where: { tenantId, empleadoId, permisoCatalogoId: { in: [...catalogoPorCodigo.values()].map(p => p.id) } },
    select: { id: true, permisoCatalogoId: true },
  })
  const existentePorPermisoId = new Map(existentes.map(e => [e.permisoCatalogoId, e.id]))

  const operaciones = permisos
    .filter(({ codigo }) => catalogoPorCodigo.has(codigo))
    .map(({ codigo, activo }) => {
      const permisoCatalogoId = catalogoPorCodigo.get(codigo).id
      const existenteId = existentePorPermisoId.get(permisoCatalogoId)
      return existenteId
        ? prisma.empleadoPermiso.update({ where: { id: existenteId }, data: { activo } })
        : prisma.empleadoPermiso.create({ data: { id: uuidv7(), tenantId, empleadoId, permisoCatalogoId, activo } })
    })

  await prisma.$transaction(operaciones)

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'COLABORADOR_PERMISOS_ACTUALIZADOS',
    entidadTipo: 'Empleado',
    entidadId: empleadoId,
    valorNuevo: { permisos },
  })

  publicarCambioPermisos(empleadoId)

  return { ok: true }
}

module.exports = { resolverPermisosEmpleado, obtenerMisPermisos, obtenerPermisosDetalleEmpleado, actualizarPermisosEmpleado }
