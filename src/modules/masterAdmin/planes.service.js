'use strict'

const { v7: uuidv7 } = require('uuid')
const prisma = require('../../lib/prisma')

function camposPlane(datos) {
  return {
    nombre: datos.nombre,
    precio: datos.precio,
    limitePrestamos: datos.limitePrestamos,
    limiteCobradores: datos.limiteCobradores,
    limiteMensajesWsp: datos.limiteMensajesWsp,
    consultasScore: datos.consultasScore,
    tieneBot: datos.tieneBot,
    tienePortalCliente: datos.tienePortalCliente,
    tieneFirmaDigital: datos.tieneFirmaDigital,
    precioPréstamoAdicional: datos.precioPrestamoAdicional,
    precioColaboradorAdicional: datos.precioColaboradorAdicional,
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

async function crearPlan(datos) {
  const plan = await prisma.plan.create({
    data: { id: uuidv7(), ...camposPlane(datos) },
  })
  return { plan }
}

async function actualizarPlan(id, datos) {
  const existe = await prisma.plan.findUnique({ where: { id } })
  if (!existe) return { error: 'Plan no encontrado', status: 404 }

  const plan = await prisma.plan.update({ where: { id }, data: camposPlane(datos) })
  return { plan }
}

async function cambiarEstadoPlan(id) {
  const existe = await prisma.plan.findUnique({ where: { id } })
  if (!existe) return { error: 'Plan no encontrado', status: 404 }

  const nuevoEstado = existe.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
  const plan = await prisma.plan.update({ where: { id }, data: { estado: nuevoEstado } })
  return { plan }
}

async function actualizarConfigPlan(id, datos) {
  const existe = await prisma.plan.findUnique({ where: { id } })
  if (!existe) return { error: 'Plan no encontrado', status: 404 }

  const plan = await prisma.plan.update({
    where: { id },
    data: {
      precio: datos.precio,
      limitePrestamos: datos.limitePrestamos,
      limiteCobradores: datos.limiteCobradores,
      limiteMensajesWsp: datos.limiteMensajesWsp,
      consultasScore: datos.consultasScore,
      precioPréstamoAdicional: datos.precioPrestamoAdicional,
      precioColaboradorAdicional: datos.precioColaboradorAdicional,
    },
  })
  return { plan }
}

module.exports = { listarPlanes, crearPlan, actualizarPlan, cambiarEstadoPlan, actualizarConfigPlan }
