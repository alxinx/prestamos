'use strict'

const prisma = require('../../../lib/prisma')

// Solo lectura — usado para poblar el select de zona de cobertura en el registro
// de clientes. La gestión de zonas (crear/editar) no está construida todavía.
async function listarZonas(req) {
  const { tenantId } = req.empleado

  const zonas = await prisma.zonaCobertura.findMany({
    where: { tenantId, activa: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  })

  return { zonas }
}

module.exports = { listarZonas }
