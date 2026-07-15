'use strict'

// Créditos que todavía comprometen el capital de la caja / cuentan como deuda
// activa del cliente (aún no pagados/cancelados). Compartido entre capital
// (cuánto capital sigue "en la calle") y clientes (número/valor de préstamos
// activos por cliente) — una sola definición para no divergir en silencio.
const ESTADOS_CREDITO_ACTIVOS = ['ACTIVO', 'EN_MORA', 'VENCIDO']

module.exports = { ESTADOS_CREDITO_ACTIVOS }
