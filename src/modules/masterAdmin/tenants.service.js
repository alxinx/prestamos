'use strict'

const { v7: uuidv7 } = require('uuid')
const prisma = require('../../lib/prisma')
const { enviarEmail } = require('../../lib/email')
const { registrarAuditoria } = require('../../lib/auditoria')
const { emailActivacionTenant } = require('../../emails/activacionTenant')
const { emailCambioEstado }     = require('../../emails/cambioEstado')
const { emailCambioPlan }       = require('../../emails/cambioPlan')
const { generarTokenActivacion: generarToken, calcularExpiracionActivacion } = require('../../lib/tokenActivacion')

function enviarEmailActivacion(tenant, tokenActivacion) {
  const urlActivacion = `${process.env.APP_URL}/activar?token=${tokenActivacion}`
  const urlTutorial = process.env.YOUTUBE_TUTORIAL_URL || 'https://youtube.com/@gotapay'
  enviarEmail({
    destinatario: tenant.email,
    asunto: `Activa tu cuenta en GotaPay — ${tenant.nombreNegocio}`,
    html: emailActivacionTenant({
      nombreCompleto: tenant.nombreCompleto,
      nombreNegocio: tenant.nombreNegocio,
      plan: tenant.plan,
      urlActivacion,
      urlTutorial,
    }),
  }).catch(err => console.error('[Email] Error enviando activación a', tenant.email, ':', err.message))
}

function generarSubdominio(nombreNegocio) {
  return nombreNegocio
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // eliminar tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
}

async function subdominioUnico(base) {
  let subdominio = base
  let intento = 0
  while (true) {
    const existe = await prisma.tenant.findUnique({ where: { subdominio } })
    if (!existe) return subdominio
    intento++
    subdominio = `${base}-${intento}`
  }
}

async function estadisticasTenants() {
  const [grupos, total] = await Promise.all([
    prisma.tenant.groupBy({ by: ['estado'], _count: { _all: true } }),
    prisma.tenant.count(),
  ])
  const porEstado = { ACTIVO: 0, PERIODO_GRACIA: 0, SUSPENDIDO: 0, CANCELADO: 0 }
  grupos.forEach(g => { porEstado[g.estado] = g._count._all })
  return { total, porEstado }
}

async function listarTenants({ busqueda = '', pagina = 1, porPagina = 10 } = {}) {
  const where = busqueda
    ? {
        OR: [
          { nombreNegocio: { contains: busqueda } },
          { email: { contains: busqueda } },
          { numeroIdentificacion: { contains: busqueda } },
        ],
      }
    : {}

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      include: { plan: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.tenant.count({ where }),
  ])

  return { tenants, total, pagina, porPagina, totalPaginas: Math.ceil(total / porPagina) }
}

async function crearTenant(datos, masterAdminId) {
  const plan = await prisma.plan.findUnique({ where: { id: datos.planId } })
  if (!plan) return { error: 'Plan no encontrado', status: 404 }
  if (plan.estado !== 'ACTIVO') return { error: 'El plan seleccionado no está activo', status: 422 }

  const baseSubdominio = generarSubdominio(datos.nombreNegocio)
  const subdominio = await subdominioUnico(baseSubdominio)

  const fechaInicio = datos.fechaInicio ? new Date(datos.fechaInicio) : new Date()
  const fechaVencimiento = new Date(fechaInicio)
  fechaVencimiento.setDate(fechaVencimiento.getDate() + 30)

  const tokenActivacion = generarToken()
  const tokenActivacionExpira = calcularExpiracionActivacion()

  const tenant = await prisma.tenant.create({
    data: {
      id: uuidv7(),
      planId: datos.planId,
      nombreNegocio: datos.nombreNegocio,
      tipoPersona: datos.tipoPersona,
      nombreCompleto: datos.nombreCompleto,
      razonSocial: datos.razonSocial ?? null,
      tipoIdentificacion: datos.tipoIdentificacion,
      numeroIdentificacion: datos.numeroIdentificacion,
      email: datos.email,
      telefono: datos.telefono ?? null,
      subdominio,
      estado: datos.estado ?? 'ACTIVO',
      fechaInicio,
      fechaVencimiento,
      tokenActivacion,
      tokenActivacionExpira,
    },
    include: { plan: true },
  })

  await registrarAuditoria({
    tenantId: tenant.id,
    accion: 'TENANT_CREADO',
    entidadTipo: 'Tenant',
    entidadId: tenant.id,
    valorNuevo: { nombreNegocio: tenant.nombreNegocio, email: tenant.email, planId: tenant.planId, estado: tenant.estado },
    metadata: { masterAdminId },
  })

  enviarEmailActivacion(tenant, tokenActivacion)
  return { tenant }
}

async function actualizarTenant(id, datos, masterAdminId) {
  const existe = await prisma.tenant.findUnique({
    where: { id },
    include: { plan: true },
  })
  if (!existe) return { error: 'Tenant no encontrado', status: 404 }

  if (datos.planId && datos.planId !== existe.planId) {
    const plan = await prisma.plan.findUnique({ where: { id: datos.planId } })
    if (!plan) return { error: 'Plan no encontrado', status: 404 }
  }

  const estadoCambio = datos.estado && datos.estado !== existe.estado
  const planCambio   = datos.planId && datos.planId !== existe.planId

  const tenant = await prisma.tenant.update({
    where: { id },
    data: {
      planId: datos.planId,
      nombreNegocio: datos.nombreNegocio,
      tipoPersona: datos.tipoPersona,
      nombreCompleto: datos.nombreCompleto,
      razonSocial: datos.razonSocial ?? null,
      tipoIdentificacion: datos.tipoIdentificacion,
      numeroIdentificacion: datos.numeroIdentificacion,
      email: datos.email,
      telefono: datos.telefono ?? null,
      estado: datos.estado,
      ...(datos.fechaInicio && {
        fechaInicio: new Date(datos.fechaInicio),
        fechaVencimiento: (() => { const f = new Date(datos.fechaInicio); f.setDate(f.getDate() + 30); return f })(),
      }),
    },
    include: { plan: true },
  })

  if (estadoCambio) {
    enviarEmail({
      destinatario: tenant.email,
      asunto: `Actualización de estado de tu cuenta — GotaPay`,
      html: emailCambioEstado({
        nombreCompleto: tenant.nombreCompleto,
        nombreNegocio:  tenant.nombreNegocio,
        estadoAnterior: existe.estado,
        estadoNuevo:    tenant.estado,
      }),
    }).catch(err => console.error('[Email] Error enviando cambio de estado a', tenant.email, ':', err.message))
  }

  if (planCambio) {
    enviarEmail({
      destinatario: tenant.email,
      asunto: `Tu plan en GotaPay ha cambiado — ${tenant.plan.nombre}`,
      html: emailCambioPlan({
        nombreCompleto: tenant.nombreCompleto,
        nombreNegocio:  tenant.nombreNegocio,
        planAnterior:   existe.plan,
        planNuevo:      tenant.plan,
      }),
    }).catch(err => console.error('[Email] Error enviando cambio de plan a', tenant.email, ':', err.message))
  }

  await registrarAuditoria({
    tenantId: tenant.id,
    accion: 'TENANT_EDITADO',
    entidadTipo: 'Tenant',
    entidadId: tenant.id,
    valorAnterior: { nombreNegocio: existe.nombreNegocio, email: existe.email, planId: existe.planId, estado: existe.estado },
    valorNuevo: { nombreNegocio: tenant.nombreNegocio, email: tenant.email, planId: tenant.planId, estado: tenant.estado },
    metadata: { masterAdminId },
  })

  return { tenant }
}

async function obtenerTenant(id) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      plan: true,
      facturas: { orderBy: { fechaGeneracion: 'desc' }, take: 6 },
      actividadResumen: true,
    },
  })
  if (!tenant) return { error: 'Tenant no encontrado', status: 404 }
  return { tenant }
}

async function reenviarActivacion(id, masterAdminId) {
  const tenant = await prisma.tenant.findUnique({ where: { id }, include: { plan: true } })
  if (!tenant) return { error: 'Tenant no encontrado', status: 404 }

  const tokenActivacion = generarToken()
  const tokenActivacionExpira = calcularExpiracionActivacion()

  await prisma.tenant.update({
    where: { id },
    data: { tokenActivacion, tokenActivacionExpira },
  })

  await registrarAuditoria({
    tenantId: tenant.id,
    accion: 'TENANT_ACTIVACION_REENVIADA',
    entidadTipo: 'Tenant',
    entidadId: tenant.id,
    metadata: { masterAdminId },
  })

  enviarEmailActivacion(tenant, tokenActivacion)
  return { ok: true }
}

async function verificarEmailDisponible(email, excluirId = null) {
  const where = { email: email.toLowerCase().trim() }
  if (excluirId) where.id = { not: excluirId }
  const existe = await prisma.tenant.findFirst({ where })
  return { disponible: !existe }
}

// La mayoría de tablas (empleados, clientes, cajas, etc.) guardan tenantId como
// columna simple, sin @relation hacia Tenant, así que no tienen FK real — el
// aislamiento multi-tenant es a nivel de aplicación (CLAUDE.md §3). Pero 4
// modelos SÍ declaran @relation(fields: [tenantId], references: [id]) y por
// eso MySQL sí les exige la FK: Factura, Suspension, ImpersonacionTenant y
// TenantActividadResumen — y PagoManual depende a su vez de Factura. Hay que
// borrar esa cadena antes que el Tenant o la DB rechaza el DELETE.
async function borrarDependenciasDeTenants(tx, tenantIds) {
  const facturas = await tx.factura.findMany({ where: { tenantId: { in: tenantIds } }, select: { id: true } })
  const facturaIds = facturas.map(f => f.id)

  if (facturaIds.length > 0) {
    await tx.pagoManual.deleteMany({ where: { facturaId: { in: facturaIds } } })
  }
  await tx.factura.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await tx.suspension.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await tx.impersonacionTenant.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await tx.tenantActividadResumen.deleteMany({ where: { tenantId: { in: tenantIds } } })
}

async function eliminarUltimoTenant() {
  const ultimo = await prisma.tenant.findFirst({ orderBy: { createdAt: 'desc' } })
  if (!ultimo) return { error: 'No hay tenants registrados', status: 404 }

  await prisma.$transaction(async tx => {
    await borrarDependenciasDeTenants(tx, [ultimo.id])
    await tx.tenant.delete({ where: { id: ultimo.id } })
  })

  return { ok: true, eliminado: ultimo.nombreNegocio }
}

// Herramienta de desarrollo: borra en bloque los tenants seleccionados en el
// checklist de /master-admin/tenants. Sigue siendo un DELETE físico sin
// cascada hacia las tablas SIN FK (empleados/clientes/cajas/etc. quedan
// huérfanos) — aceptable solo porque esta ruta está bloqueada en producción
// (ver manejarEliminarSeleccionados).
async function eliminarTenants(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { error: 'Selecciona al menos un tenant', status: 400 }
  }

  const eliminados = await prisma.$transaction(async tx => {
    await borrarDependenciasDeTenants(tx, ids)
    const resultado = await tx.tenant.deleteMany({ where: { id: { in: ids } } })
    return resultado.count
  })

  return { ok: true, eliminados }
}

module.exports = { estadisticasTenants, listarTenants, crearTenant, actualizarTenant, obtenerTenant, reenviarActivacion, eliminarUltimoTenant, eliminarTenants, verificarEmailDisponible }
