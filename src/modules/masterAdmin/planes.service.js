'use strict'

const { v7: uuidv7 } = require('uuid')
const prisma = require('../../lib/prisma')
const { registrarAuditoria } = require('../../lib/auditoria')

// Prisma.Decimal no es serializable como JSON tal cual (campo `datos` viene de
// Zod con Number, pero `existe` viene de Prisma con Decimal) — se normaliza a
// Number solo para el snapshot de auditoría, nunca para los cálculos de negocio.
function numero(valor) {
  return valor != null && typeof valor.toNumber === 'function' ? valor.toNumber() : valor
}

// Campos de precio/límites — comunes entre la edición completa del plan (camposPlane)
// y la edición rápida de configuración (actualizarConfigPlan), que no toca nombre/features/estado.
function camposConfigPlan(datos) {
  return {
    precio: numero(datos.precio),
    limitePrestamos: datos.limitePrestamos,
    limiteColaboradores: datos.limiteColaboradores,
    limiteMensajesWsp: datos.limiteMensajesWsp,
    consultasScore: datos.consultasScore,
    precioPréstamoAdicional: numero(datos.precioPréstamoAdicional ?? datos.precioPrestamoAdicional),
    precioColaboradorAdicional: numero(datos.precioColaboradorAdicional),
  }
}

function camposPlane(datos) {
  return {
    nombre: datos.nombre,
    ...camposConfigPlan(datos),
    tieneBot: datos.tieneBot,
    tienePortalCliente: datos.tienePortalCliente,
    tieneFirmaDigital: datos.tieneFirmaDigital,
    estado: datos.estado,
  }
}

async function listarPlanes() {
  const planes = await prisma.plan.findMany({
    orderBy: { precio: 'asc' },
    include: { _count: { select: { tenants: true } } },
  })
  return { planes }
}

async function obtenerPlan(id) {
  const plan = await prisma.plan.findUnique({
    where: { id },
    include: { _count: { select: { tenants: true } } },
  })
  if (!plan) return { error: 'Plan no encontrado', status: 404 }

  const conteoPorEstado = await prisma.tenant.groupBy({
    by: ['estado'],
    where: { planId: id },
    _count: { _all: true },
  })

  const statsPorEstado = { ACTIVO: 0, PERIODO_GRACIA: 0, SUSPENDIDO: 0, CANCELADO: 0 }
  conteoPorEstado.forEach(g => { statsPorEstado[g.estado] = g._count._all })

  const ultimosTenants = await prisma.tenant.findMany({
    where: { planId: id },
    select: { id: true, nombreNegocio: true, estado: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return { plan, statsPorEstado, ultimosTenants }
}

async function crearPlan(datos, masterAdminId) {
  const plan = await prisma.plan.create({
    data: { id: uuidv7(), ...camposPlane(datos) },
  })

  await registrarAuditoria({
    accion: 'PLAN_CREADO',
    entidadTipo: 'Plan',
    entidadId: plan.id,
    valorNuevo: camposPlane(datos),
    metadata: { masterAdminId },
  })

  return { plan }
}

async function actualizarPlan(id, datos, masterAdminId) {
  const existe = await prisma.plan.findUnique({ where: { id } })
  if (!existe) return { error: 'Plan no encontrado', status: 404 }

  const plan = await prisma.plan.update({ where: { id }, data: camposPlane(datos) })

  await registrarAuditoria({
    accion: 'PLAN_EDITADO',
    entidadTipo: 'Plan',
    entidadId: plan.id,
    valorAnterior: camposPlane(existe),
    valorNuevo: camposPlane(datos),
    metadata: { masterAdminId },
  })

  return { plan }
}

async function cambiarEstadoPlan(id, masterAdminId) {
  const existe = await prisma.plan.findUnique({ where: { id } })
  if (!existe) return { error: 'Plan no encontrado', status: 404 }

  const nuevoEstado = existe.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
  const plan = await prisma.plan.update({ where: { id }, data: { estado: nuevoEstado } })

  await registrarAuditoria({
    accion: 'PLAN_CAMBIO_ESTADO',
    entidadTipo: 'Plan',
    entidadId: plan.id,
    valorAnterior: { estado: existe.estado },
    valorNuevo: { estado: plan.estado },
    metadata: { masterAdminId },
  })

  return { plan }
}

async function actualizarConfigPlan(id, datos, masterAdminId) {
  const existe = await prisma.plan.findUnique({ where: { id } })
  if (!existe) return { error: 'Plan no encontrado', status: 404 }

  const plan = await prisma.plan.update({ where: { id }, data: camposConfigPlan(datos) })

  await registrarAuditoria({
    accion: 'PLAN_CONFIG_ACTUALIZADA',
    entidadTipo: 'Plan',
    entidadId: plan.id,
    valorAnterior: camposConfigPlan(existe),
    valorNuevo: camposConfigPlan(datos),
    metadata: { masterAdminId },
  })

  return { plan }
}

module.exports = { listarPlanes, obtenerPlan, crearPlan, actualizarPlan, cambiarEstadoPlan, actualizarConfigPlan }
