'use strict'

const { obtenerUsoLimitePrestamos } = require('../../../lib/limitesPlan')
const { carteraEnMoraDe } = require('../creditos/creditos.service')

// "Créditos activos" del dashboard: cuántos créditos vigentes tiene el tenant
// hoy vs. cuántos le permite su plan rentado (Plan.limitePrestamos). Reutiliza
// el mismo cálculo que la validación estricta de creditos.service.js — una
// sola fuente de verdad para no divergir en silencio.
async function creditosActivosResumen(req) {
  const { usados, limite } = await obtenerUsoLimitePrestamos(req.empleado.tenantId)
  return { usados, limite }
}

// "Cartera en mora" del dashboard — misma fuente única que Prestamos.jsx y
// Clientes.jsx (carteraEnMoraDe en creditos.service.js), para no divergir.
async function carteraEnMoraResumen(req) {
  const carteraEnMora = await carteraEnMoraDe(req.empleado.tenantId)
  return { carteraEnMora }
}

module.exports = { creditosActivosResumen, carteraEnMoraResumen }
