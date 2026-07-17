'use strict'

const prisma = require('../../../lib/prisma')
const { ESTADOS_CREDITO_ACTIVOS } = require('../../../lib/creditosConstantes')

// "Créditos activos" del dashboard: cuántos créditos vigentes tiene el tenant
// hoy vs. cuántos le permite su plan rentado (Plan.limitePrestamos). El límite
// se lee siempre del plan actual del tenant en BD, nunca del JWT — el tenant
// puede cambiar de plan sin volver a iniciar sesión.
async function creditosActivosResumen(req) {
  const { tenantId } = req.empleado

  const [usados, tenant] = await Promise.all([
    prisma.credito.count({ where: { tenantId, estado: { in: ESTADOS_CREDITO_ACTIVOS } } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { plan: { select: { limitePrestamos: true } } } }),
  ])

  return { usados, limite: tenant.plan.limitePrestamos }
}

module.exports = { creditosActivosResumen }
