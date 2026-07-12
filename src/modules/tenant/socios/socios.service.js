'use strict'

const { v7: uuidv7 } = require('uuid')
const prisma = require('../../../lib/prisma')
const { registrarAuditoria } = require('../../../lib/auditoria')
const { enviarEmail } = require('../../../lib/email')
const { verificarContrasenaEmpleado } = require('../../../lib/verificarContrasena')
const { emailSocioMatriculado } = require('../../../emails/socioMatriculado')
const { emailSocioSuspendido } = require('../../../emails/socioSuspendido')
const { emailSocioReactivado } = require('../../../emails/socioReactivado')

const SELECT_SOCIO = { id: true, nombreCompleto: true, cedula: true, telefono: true, email: true, activo: true, createdAt: true }

function enviarEmailSocioMatriculado(socio, nombreNegocio) {
  if (!socio.email) return
  enviarEmail({
    destinatario: socio.email,
    asunto: `Te registraron como socio — ${nombreNegocio}`,
    html: emailSocioMatriculado({ nombreCompleto: socio.nombreCompleto, nombreNegocio }),
  }).catch(err => console.error('[Email] Error enviando matrícula de socio a', socio.email, ':', err.message))
}

function enviarEmailSocioSuspendido(socio, nombreNegocio) {
  if (!socio.email) return
  enviarEmail({
    destinatario: socio.email,
    asunto: `Perfil de socio suspendido — ${nombreNegocio}`,
    html: emailSocioSuspendido({ nombreCompleto: socio.nombreCompleto, nombreNegocio }),
  }).catch(err => console.error('[Email] Error enviando suspensión de socio a', socio.email, ':', err.message))
}

function enviarEmailSocioReactivado(socio, nombreNegocio) {
  if (!socio.email) return
  enviarEmail({
    destinatario: socio.email,
    asunto: `Perfil de socio reactivado — ${nombreNegocio}`,
    html: emailSocioReactivado({ nombreCompleto: socio.nombreCompleto, nombreNegocio }),
  }).catch(err => console.error('[Email] Error enviando reactivación de socio a', socio.email, ':', err.message))
}

// Devuelve TODOS los socios del tenant (activos y suspendidos — el frontend
// necesita ver los suspendidos para poder reactivarlos) con el capital total
// invertido (suma de sus cajas activas) y el porcentaje que representa sobre el
// capital global — ambos calculados en tiempo real, nunca persistidos (CLAUDE.md).
async function listarSocios(req) {
  const { tenantId } = req.empleado

  const [socios, sumasPorSocio] = await Promise.all([
    prisma.socio.findMany({
      where: { tenantId },
      select: SELECT_SOCIO,
      orderBy: { createdAt: 'asc' },
    }),
    prisma.caja.groupBy({
      by: ['socioId'],
      where: { tenantId, estado: 'ACTIVA' },
      _sum: { capitalInicial: true },
    }),
  ])

  const totalPorSocio = new Map(sumasPorSocio.map(s => [s.socioId, Number(s._sum.capitalInicial ?? 0)]))
  const totalGlobal = [...totalPorSocio.values()].reduce((suma, monto) => suma + monto, 0)

  const resultado = socios.map(s => {
    const montoTotal = totalPorSocio.get(s.id) ?? 0
    return {
      ...s,
      montoTotal,
      porcentaje: totalGlobal > 0 ? Number((montoTotal / totalGlobal * 100).toFixed(1)) : 0,
    }
  })

  return { socios: resultado }
}

async function crearSocio(req) {
  const { tenantId, id: autorId } = req.empleado
  const datos = req.body

  const id = uuidv7()
  const [socio, tenant] = await Promise.all([
    prisma.socio.create({
      data: {
        id,
        tenantId,
        nombreCompleto: datos.nombreCompleto,
        cedula: datos.cedula,
        telefono: datos.telefono || null,
        email: datos.email || null,
      },
      select: SELECT_SOCIO,
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombreNegocio: true } }),
  ])

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'SOCIO_CREADO',
    entidadTipo: 'Socio',
    entidadId: id,
    valorNuevo: { nombreCompleto: socio.nombreCompleto, cedula: socio.cedula },
  })

  enviarEmailSocioMatriculado(socio, tenant?.nombreNegocio ?? 'GotaPay')

  return { socio: { ...socio, montoTotal: 0, porcentaje: 0 } }
}

// Suspende a un socio: no se le asignarán nuevos capitales, pero los que ya tiene
// activos siguen funcionando con normalidad — la suspensión no cascada sobre sus
// cajas. Requiere reconfirmar contraseña, igual que suspenderCapital.
async function suspenderSocio(req) {
  const { tenantId, id: autorId } = req.empleado
  const { id } = req.params
  const { password } = req.body

  const socio = await prisma.socio.findFirst({ where: { id, tenantId } })
  if (!socio) return { error: 'Socio no encontrado', status: 404 }
  if (!socio.activo) return { error: 'Este socio ya está suspendido', status: 422 }

  const passwordValida = await verificarContrasenaEmpleado({ empleadoId: autorId, password })
  if (!passwordValida) return { error: 'Contraseña incorrecta', status: 401 }

  const [actualizado, tenant] = await Promise.all([
    prisma.socio.update({ where: { id }, data: { activo: false }, select: SELECT_SOCIO }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombreNegocio: true } }),
  ])

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'SOCIO_SUSPENDIDO',
    entidadTipo: 'Socio',
    entidadId: id,
    valorAnterior: { activo: true },
    valorNuevo: { activo: false },
  })

  enviarEmailSocioSuspendido(actualizado, tenant?.nombreNegocio ?? 'GotaPay')

  return { socio: actualizado }
}

// Reactiva a un socio previamente suspendido. No requiere reconfirmar contraseña
// (a diferencia de suspender): es reversible y menos destructiva, y ya exige el
// permiso `capital.crear` en la ruta.
async function reactivarSocio(req) {
  const { tenantId, id: autorId } = req.empleado
  const { id } = req.params

  const socio = await prisma.socio.findFirst({ where: { id, tenantId } })
  if (!socio) return { error: 'Socio no encontrado', status: 404 }
  if (socio.activo) return { error: 'Este socio ya está activo', status: 422 }

  const [actualizado, tenant] = await Promise.all([
    prisma.socio.update({ where: { id }, data: { activo: true }, select: SELECT_SOCIO }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombreNegocio: true } }),
  ])

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'SOCIO_REACTIVADO',
    entidadTipo: 'Socio',
    entidadId: id,
    valorAnterior: { activo: false },
    valorNuevo: { activo: true },
  })

  enviarEmailSocioReactivado(actualizado, tenant?.nombreNegocio ?? 'GotaPay')

  return { socio: actualizado }
}

module.exports = { listarSocios, crearSocio, suspenderSocio, reactivarSocio }
