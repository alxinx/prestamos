'use strict'

const bcrypt = require('bcrypt')
const { v7: uuidv7 } = require('uuid')
const prisma = require('../../lib/prisma')

async function verificarToken({ token, email }) {
  const tenant = await prisma.tenant.findFirst({
    where: { tokenActivacion: token, email: email.toLowerCase().trim() },
    include: { plan: { select: { nombre: true } } },
  })

  if (!tenant) return { error: 'Token inválido o email incorrecto.', status: 400 }
  if (!tenant.tokenActivacionExpira || tenant.tokenActivacionExpira < new Date()) {
    return { error: 'El enlace de activación ha expirado. Solicita uno nuevo al administrador.', status: 400 }
  }

  return { valido: true, nombreNegocio: tenant.nombreNegocio, plan: tenant.plan.nombre }
}

async function completarActivacion({ token, email, nombreCompleto, password }) {
  const tenant = await prisma.tenant.findFirst({
    where: { tokenActivacion: token, email: email.toLowerCase().trim() },
  })

  if (!tenant) return { error: 'Token inválido.', status: 400 }
  if (!tenant.tokenActivacionExpira || tenant.tokenActivacionExpira < new Date()) {
    return { error: 'El enlace de activación ha expirado.', status: 400 }
  }

  const empleadoExistente = await prisma.empleado.findFirst({
    where: { tenantId: tenant.id, esSuperAdmin: true },
  })
  if (empleadoExistente) return { error: 'Esta cuenta ya fue activada.', status: 409 }

  // Crear o reusar el rol ADMINISTRADOR del tenant
  let rol = await prisma.rol.findFirst({
    where: { tenantId: tenant.id, nombre: 'ADMINISTRADOR' },
  })
  if (!rol) {
    rol = await prisma.rol.create({
      data: {
        id:           uuidv7(),
        tenantId:     tenant.id,
        nombre:       'ADMINISTRADOR',
        esPredefinido: true,
        descripcion:  'Administrador principal del tenant',
      },
    })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.empleado.create({
    data: {
      id:            uuidv7(),
      tenantId:      tenant.id,
      rolId:         rol.id,
      nombreCompleto,
      cedula:        '',
      telefono:      '',
      email:         tenant.email,
      passwordHash,
      esSuperAdmin:  true,
      estado:        'ACTIVO',
      fechaIngreso:  new Date(),
    },
  })

  // Limpiar el token de activación
  await prisma.tenant.update({
    where: { id: tenant.id },
    data:  { tokenActivacion: null, tokenActivacionExpira: null },
  })

  return { ok: true }
}

module.exports = { verificarToken, completarActivacion }
