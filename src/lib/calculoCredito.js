'use strict'

const { Prisma } = require('@prisma/client')
const { DIAS_POR_FRECUENCIA } = require('./creditosConstantes')

// Interés flat (plano) sobre el capital inicial — modelo estándar del crédito
// informal "gota a gota" colombiano (CLAUDE.md §1): el interés se calcula UNA
// sola vez sobre el capital, no se recalcula período a período sobre saldo
// insoluto. Confirmado contra el mockup del wizard de préstamos (2026-07-16):
// $1.000.000 al 5% / 7 cuotas -> intereses $50.000, total $1.050.000, cuota
// $150.000 exacto.
//
// numeroCuotas = 0 es un crédito real de "SOLO INTERESES" (decisión
// 2026-07-16): no hay plazo ni fecha de vencimiento fija — se cobra
// tasaInteres% del capital cada frecuenciaPago, indefinidamente, y el cliente
// paga el capital aparte cuando decida. En ese caso totalIntereses ES el
// monto periódico a cobrar (no hay "total del contrato" que tenga sentido).
//
// Toda la aritmética usa Prisma.Decimal — nunca +/-/*// nativos de JS
// (CLAUDE.md §4). La base (totalIntereses, totalAPagar) SIEMPRE redondea
// hacia arriba (ROUND_UP) a peso entero: el prestamista nunca pierde un peso,
// el cliente nunca paga menos de lo pactado — esas son cifras contractuales y
// quedan exactas sin importar `redondearCuotaMil`.
//
// `redondearCuotaMil` es una preferencia aparte, solo para el valor que se
// cobra en efectivo cada período (valorCuota, o el monto periódico si es solo
// intereses): redondea al múltiplo de 1.000 más cercano (puede subir o bajar,
// a diferencia del ROUND_UP de la base) para facilitar el manejo de billetes.
// Se persiste en Credito.redondearCuotaMil porque la cuota nunca se guarda
// (CLAUDE.md §4) — sin el flag, cada recálculo futuro (listados, tabla de
// mora) mostraría un número distinto al que el operador ya le dijo al cliente.
//
// Se redondea a 0 decimales (peso entero), NO a 2 (centavos): toda la app
// muestra dinero sin decimales (formatearPrecio usa maximumFractionDigits: 0,
// que redondea con SU propia regla al mostrar) — si acá se dejaran centavos,
// el "hacia arriba" se perdería silenciosamente en esa segunda conversión al
// mostrar. Encontrado probando en vivo (2026-07-16): $1.150.000 / 12 mostraba
// $95.833 (redondeado hacia abajo por Intl.NumberFormat) en vez de $95.834.
// Decimal(15,2) en el schema sigue siendo el tipo de columna correcto para
// dinero — el redondeo a entero es una decisión de negocio, no de esquema.
//
// Única fuente de verdad para esta fórmula — la usan tanto la simulación en
// vivo del wizard (POST /simular) como la creación real del crédito, así
// nunca pueden divergir entre lo que el operador vio y lo que quedó guardado.
function calcularResumenCredito({ montoInicial, tasaInteres, numeroCuotas, frecuenciaPago, fechaInicio, redondearCuotaMil = false }) {
  const capital = new Prisma.Decimal(montoInicial)
  const tasa = new Prisma.Decimal(tasaInteres)

  const totalIntereses = capital.times(tasa).dividedBy(100).toDecimalPlaces(0, Prisma.Decimal.ROUND_UP)
  const totalAPagar = capital.plus(totalIntereses)

  function redondearAMil(valor) {
    return redondearCuotaMil
      ? valor.dividedBy(1000).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).times(1000)
      : valor
  }

  const cuotas = Number(numeroCuotas)
  const esSoloIntereses = cuotas === 0
  const diasCobro = DIAS_POR_FRECUENCIA[frecuenciaPago] ?? null

  let valorCuota = null
  let fechaVencimiento = null
  let valorPeriodico = null

  if (esSoloIntereses) {
    valorPeriodico = redondearAMil(totalIntereses)
  } else if (cuotas > 0) {
    valorCuota = redondearAMil(totalAPagar.dividedBy(cuotas).toDecimalPlaces(0, Prisma.Decimal.ROUND_UP))
    if (diasCobro && fechaInicio) {
      fechaVencimiento = new Date(fechaInicio)
      fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCobro * cuotas)
    }
  }

  return { totalIntereses, totalAPagar, valorCuota, fechaVencimiento, esSoloIntereses, valorPeriodico, diasCobro }
}

module.exports = { calcularResumenCredito }
