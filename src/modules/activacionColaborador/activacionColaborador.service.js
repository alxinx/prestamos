'use strict'

const bcrypt = require('bcrypt')
const prisma = require('../../lib/prisma')

async function verificarToken({ token, email }) {
  const empleado = await prisma.empleado.findFirst({
    where: { tokenActivacion: token, email: email.toLowerCase().trim() },
    include: { rol: { select: { nombre: true } } },
  })

  if (!empleado) return { error: 'Token inválido o email incorrecto.', status: 400 }
  if (!empleado.tokenActivacionExpira || empleado.tokenActivacionExpira < new Date()) {
    return { error: 'El enlace de activación ha expirado. Solicita uno nuevo al administrador.', status: 400 }
  }
  if (empleado.passwordHash) return { error: 'Esta cuenta ya fue activada.', status: 409 }

  return { valido: true, nombreCompleto: empleado.nombreCompleto, rol: empleado.rol.nombre }
}

async function completarActivacion({ token, email, password }) {
  const empleado = await prisma.empleado.findFirst({
    where: { tokenActivacion: token, email: email.toLowerCase().trim() },
  })

  if (!empleado) return { error: 'Token inválido.', status: 400 }
  if (!empleado.tokenActivacionExpira || empleado.tokenActivacionExpira < new Date()) {
    return { error: 'El enlace de activación ha expirado.', status: 400 }
  }
  if (empleado.passwordHash) return { error: 'Esta cuenta ya fue activada.', status: 409 }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.empleado.update({
    where: { id: empleado.id },
    data: {
      passwordHash,
      tokenActivacion: null,
      tokenActivacionExpira: null,
    },
  })

  return { ok: true }
}

module.exports = { verificarToken, completarActivacion }
