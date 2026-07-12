'use strict'

const bcrypt = require('bcrypt')
const prisma = require('./prisma')

// Reconfirma la contraseña del empleado autenticado antes de ejecutar una acción
// sensible (ej. suspender un capital) — capa extra de seguridad más allá de tener
// la sesión activa. Reutilizable por cualquier flujo futuro que necesite el mismo
// "vuelve a escribir tu contraseña para continuar".
async function verificarContrasenaEmpleado({ empleadoId, password }) {
  const empleado = await prisma.empleado.findUnique({
    where: { id: empleadoId },
    select: { passwordHash: true },
  })
  if (!empleado?.passwordHash) return false
  return bcrypt.compare(password, empleado.passwordHash)
}

module.exports = { verificarContrasenaEmpleado }
