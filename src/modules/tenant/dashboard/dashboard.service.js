'use strict'

const { obtenerUsoLimitePrestamos } = require('../../../lib/limitesPlan')

// "Créditos activos" del dashboard: cuántos créditos vigentes tiene el tenant
// hoy vs. cuántos le permite su plan rentado (Plan.limitePrestamos). Reutiliza
// el mismo cálculo que la validación estricta de creditos.service.js — una
// sola fuente de verdad para no divergir en silencio.
async function creditosActivosResumen(req) {
  const { usados, limite } = await obtenerUsoLimitePrestamos(req.empleado.tenantId)
  return { usados, limite }
}

module.exports = { creditosActivosResumen }
