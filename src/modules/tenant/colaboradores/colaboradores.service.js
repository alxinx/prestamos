'use strict'

const crypto = require('crypto')
const { v7: uuidv7 } = require('uuid')
const prisma = require('../../../lib/prisma')
const { registrarAuditoria } = require('../../../lib/auditoria')
const { subirDocumentoEmpleado, ErrorDocumento } = require('../../../lib/documentos')
const { enviarEmail } = require('../../../lib/email')
const { emailActivacionColaborador } = require('../../../emails/activacionColaborador')

const EXPIRACION_TOKEN_ACTIVACION_MS = 72 * 60 * 60 * 1000

function generarTokenActivacion() {
  return crypto.randomBytes(32).toString('hex')
}

function enviarEmailActivacionColaborador({ colaborador, nombreNegocio, rolNombre, tokenActivacion }) {
  const urlActivacion = `${process.env.APP_URL}/activar-colaborador?token=${tokenActivacion}&email=${encodeURIComponent(colaborador.email)}`
  enviarEmail({
    destinatario: colaborador.email,
    asunto: `Activa tu cuenta en GotaPay — ${nombreNegocio}`,
    html: emailActivacionColaborador({
      nombreCompleto: colaborador.nombreCompleto,
      nombreNegocio,
      rol: rolNombre,
      urlActivacion,
    }),
  }).catch(err => console.error('[Email] Error enviando activación a', colaborador.email, ':', err.message))
}

const SELECT_COLABORADOR = {
  id:             true,
  nombreCompleto: true,
  cedula:         true,
  telefono:       true,
  email:          true,
  cargo:          true,
  fechaIngreso:   true,
  esSuperAdmin:   true,
  estado:         true,
  createdAt:      true,
  rol: { select: { id: true, nombre: true } },
}

async function listarColaboradores(req) {
  const { tenantId } = req.empleado

  const colaboradores = await prisma.empleado.findMany({
    where: { tenantId },
    select: SELECT_COLABORADOR,
    orderBy: { createdAt: 'desc' },
  })

  return { colaboradores }
}

async function listarRolesDisponibles(req) {
  const { tenantId } = req.empleado

  const roles = await prisma.rol.findMany({
    where: { tenantId },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  })

  return { roles }
}

async function crearColaborador(req) {
  const { tenantId, id: autorId } = req.empleado
  const datos = req.body
  const archivos = req.files || []

  const rol = await prisma.rol.findFirst({ where: { id: datos.rolId, tenantId } })
  if (!rol) return { error: 'Rol inválido', status: 400 }

  const emailExistente = await prisma.empleado.findFirst({ where: { tenantId, email: datos.email } })
  if (emailExistente) return { error: 'Ya existe un colaborador con ese correo', status: 409 }

  let documentosMeta = []
  if (datos.documentosMeta) {
    try {
      documentosMeta = JSON.parse(datos.documentosMeta)
    } catch {
      return { error: 'Metadata de documentos inválida', status: 400 }
    }
  }
  if (!Array.isArray(documentosMeta) || documentosMeta.length !== archivos.length) {
    return { error: 'La cantidad de documentos no coincide con los archivos enviados', status: 400 }
  }
  if (documentosMeta.some(d => !d?.nombre || typeof d.nombre !== 'string' || !d.nombre.trim())) {
    return { error: 'Todos los documentos deben tener un nombre', status: 400 }
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { nombreNegocio: true } })

  const id = uuidv7()
  const tokenActivacion = generarTokenActivacion()
  const tokenActivacionExpira = new Date(Date.now() + EXPIRACION_TOKEN_ACTIVACION_MS)

  const colaborador = await prisma.empleado.create({
    data: {
      id,
      tenantId,
      rolId:          datos.rolId,
      nombreCompleto: datos.nombreCompleto,
      cedula:         datos.cedula,
      telefono:       datos.telefono,
      email:          datos.email,
      passwordHash:   null,
      cargo:          datos.cargo || null,
      fechaIngreso:   new Date(),
      esSuperAdmin:   false,
      estado:         'ACTIVO',
      tokenActivacion,
      tokenActivacionExpira,
    },
    select: SELECT_COLABORADOR,
  })

  const documentos = []
  const documentosFallidos = []
  for (let i = 0; i < archivos.length; i++) {
    try {
      const documento = await subirDocumentoEmpleado({
        tenantId,
        empleadoId: id,
        subidoPorId: autorId,
        nombreArchivo: documentosMeta[i].nombre.trim(),
        archivo: archivos[i],
      })
      documentos.push(documento)
    } catch (err) {
      if (!(err instanceof ErrorDocumento)) throw err
      documentosFallidos.push({ nombre: documentosMeta[i].nombre, error: err.message })
    }
  }

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'COLABORADOR_CREADO',
    entidadTipo: 'Empleado',
    entidadId: id,
    valorNuevo: { nombreCompleto: colaborador.nombreCompleto, email: colaborador.email, rol: rol.nombre },
  })

  enviarEmailActivacionColaborador({ colaborador, nombreNegocio: tenant?.nombreNegocio ?? 'GotaPay', rolNombre: rol.nombre, tokenActivacion })

  return { colaborador, documentos, documentosFallidos }
}

async function cambiarEstadoColaborador(req) {
  const { tenantId, id: autorId } = req.empleado
  const { id } = req.params

  const colaborador = await prisma.empleado.findFirst({ where: { id, tenantId } })
  if (!colaborador) return { error: 'Colaborador no encontrado', status: 404 }

  if (colaborador.esSuperAdmin) {
    return { error: 'El super admin no puede desactivarse', status: 403 }
  }

  const nuevoEstado = colaborador.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'

  const actualizado = await prisma.empleado.update({
    where: { id },
    data: { estado: nuevoEstado },
    select: SELECT_COLABORADOR,
  })

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'COLABORADOR_CAMBIO_ESTADO',
    entidadTipo: 'Empleado',
    entidadId: id,
    valorAnterior: { estado: colaborador.estado },
    valorNuevo: { estado: nuevoEstado },
  })

  return { colaborador: actualizado }
}

module.exports = { listarColaboradores, listarRolesDisponibles, crearColaborador, cambiarEstadoColaborador }
