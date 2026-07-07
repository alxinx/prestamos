'use strict'

const bcrypt = require('bcrypt')
const { v7: uuidv7 } = require('uuid')
const prisma = require('../../../lib/prisma')
const { registrarAuditoria } = require('../../../lib/auditoria')

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

  const rol = await prisma.rol.findFirst({ where: { id: datos.rolId, tenantId } })
  if (!rol) return { error: 'Rol inválido', status: 400 }

  const emailExistente = await prisma.empleado.findFirst({ where: { tenantId, email: datos.email } })
  if (emailExistente) return { error: 'Ya existe un colaborador con ese correo', status: 409 }

  const passwordHash = await bcrypt.hash(datos.password, 12)
  const id = uuidv7()

  const colaborador = await prisma.empleado.create({
    data: {
      id,
      tenantId,
      rolId:          datos.rolId,
      nombreCompleto: datos.nombreCompleto,
      cedula:         datos.cedula,
      telefono:       datos.telefono,
      email:          datos.email,
      passwordHash,
      cargo:          datos.cargo || null,
      fechaIngreso:   new Date(),
      esSuperAdmin:   false,
      estado:         'ACTIVO',
    },
    select: SELECT_COLABORADOR,
  })

  await registrarAuditoria({
    tenantId,
    empleadoId: autorId,
    accion: 'COLABORADOR_CREADO',
    entidadTipo: 'Empleado',
    entidadId: id,
    valorNuevo: { nombreCompleto: colaborador.nombreCompleto, email: colaborador.email, rol: rol.nombre },
  })

  return { colaborador }
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
