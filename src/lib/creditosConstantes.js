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
// calculoCredito.js (fecha de vencimiento, cronograma de cuotas) y
// creditos.service.js (próxima cuota aproximada).
const DIAS_POR_FRECUENCIA = { DIARIO: 1, SEMANAL: 7, QUINCENAL: 15, MENSUAL: 30 }

// Etiqueta en español de cada FrecuenciaPago — usada en el email y el PDF de
// resumen de préstamo (backend). Espejo de ETIQUETA_FRECUENCIA_PAGO en
// frontend/src/lib/plantillaCreditoFormato.js — no se comparte el archivo
// porque frontend/backend no comparten código fuente en este proyecto, pero
// deben mantenerse en sync si cambia una.
const ETIQUETAS_FRECUENCIA = { DIARIO: 'Diario', SEMANAL: 'Semanal', QUINCENAL: 'Quincenal', MENSUAL: 'Mensual' }

// Unidad de plazo en plural, para armar "12 Meses"/"8 Semanas" (PDF de resumen
// de préstamo) — distinta de ETIQUETAS_FRECUENCIA, que es singular ("Mensual",
// usada para "5% Mensual").
const UNIDADES_PLAZO = { DIARIO: 'Días', SEMANAL: 'Semanas', QUINCENAL: 'Quincenas', MENSUAL: 'Meses' }

module.exports = { ESTADOS_CREDITO_ACTIVOS, ESTADOS_CREDITO_MORA, DIAS_POR_FRECUENCIA, ETIQUETAS_FRECUENCIA, UNIDADES_PLAZO }
