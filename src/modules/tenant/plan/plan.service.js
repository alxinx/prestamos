'use strict'

const prisma = require('../../../lib/prisma')
const { obtenerUsoLimitePrestamos, obtenerUsoLimiteColaboradores } = require('../../../lib/limitesPlan')

// Estado actual del cupo de préstamos del tenant — consumido por el wizard
// "Nuevo préstamo" para decidir si muestra el formulario o el aviso de límite
// alcanzado (mismo cálculo exacto que la validación estricta de crearCredito).
async function limitePrestamos(req) {
  return obtenerUsoLimitePrestamos(req.empleado.tenantId)
}

// Mismo propósito que limitePrestamos pero para el formulario "Nuevo
// colaborador" (ver Colaboradores.jsx y la validación estricta de crearColaborador).
async function limiteColaboradores(req) {
  return obtenerUsoLimiteColaboradores(req.empleado.tenantId)
}

// Planes que el tenant puede ver como opción de upgrade cuando alcanza su
// límite: todos los activos, más el propio aunque esté inactivo (para que
// siempre pueda ver cuál tiene actualmente).
async function opciones(req) {
  const { tenantId } = req.empleado

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { planId: true } })
  const planes = await prisma.plan.findMany({
    where: { OR: [{ estado: 'ACTIVO' }, { id: tenant.planId }] },
    orderBy: { precio: 'asc' },
  })

  return { planActualId: tenant.planId, planes }
}

module.exports = { limitePrestamos, limiteColaboradores, opciones }
