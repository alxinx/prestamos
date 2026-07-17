'use strict'

// Créditos que todavía comprometen el capital de la caja / cuentan como deuda
// activa del cliente (aún no pagados/cancelados). Compartido entre capital
// (cuánto capital sigue "en la calle") y clientes (número/valor de préstamos
// activos por cliente) — una sola definición para no divergir en silencio.
const ESTADOS_CREDITO_ACTIVOS = ['ACTIVO', 'EN_MORA', 'VENCIDO']

// Subconjunto de ESTADOS_CREDITO_ACTIVOS que específicamente representa mora —
// usado por el dashboard de préstamos ("Cartera en mora") y su tabla de mora.
const ESTADOS_CREDITO_MORA = ['EN_MORA', 'VENCIDO']

// Cuántos días representa cada valor de FrecuenciaPago (Prisma) — usado por
// calculoCredito.js (fecha de vencimiento) y creditos.service.js (próxima
// cuota aproximada) sin depender todavía de un cronograma de cuotas real.
const DIAS_POR_FRECUENCIA = { DIARIO: 1, SEMANAL: 7, QUINCENAL: 15, MENSUAL: 30 }

module.exports = { ESTADOS_CREDITO_ACTIVOS, ESTADOS_CREDITO_MORA, DIAS_POR_FRECUENCIA }
