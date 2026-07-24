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
// El valor que se cobra en efectivo cada período (valorCuota, el monto
// periódico si es solo intereses, y el desglose capital/interés del
// cronograma) SIEMPRE redondea al 100 más cercano — decisión del usuario
// (2026-07-23): en pesos colombianos no se maneja billetera/moneda por
// debajo de $100, así que $79.999 (66.666 de capital + 13.333 de interés) se
// muestra como $80.000. `redondearCuotaMil` sigue siendo una preferencia
// APARTE, encima de ese redondeo al 100: si está activa, redondea otra vez al
// múltiplo de 1.000 más cercano. Se persiste en Credito.redondearCuotaMil
// porque la cuota nunca se guarda (CLAUDE.md §4) — sin el flag, cada
// recálculo futuro (listados, tabla de mora) mostraría un número distinto al
// que el operador ya le dijo al cliente.
//
// Se redondea a 0 decimales (peso entero) antes de redondear al 100, NO a 2
// (centavos): toda la app muestra dinero sin decimales (formatearPrecio usa
// maximumFractionDigits: 0, que redondea con SU propia regla al mostrar) — si
// acá se dejaran centavos, el redondeo de negocio se perdería silenciosamente
// en esa segunda conversión al mostrar. Encontrado probando en vivo
// (2026-07-16): $1.150.000 / 12 mostraba $95.833 (redondeado hacia abajo por
// Intl.NumberFormat) en vez de $95.834. Decimal(15,2) en el schema sigue
// siendo el tipo de columna correcto para dinero — el redondeo a entero (y
// luego al 100) es una decisión de negocio, no de esquema.
//
// Única fuente de verdad para esta fórmula — la usan tanto la simulación en
// vivo del wizard (POST /simular) como la creación real del crédito, así
// nunca pueden divergir entre lo que el operador vio y lo que quedó guardado.
function redondearACien(valor) {
  return valor.dividedBy(100).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).times(100)
}

function calcularResumenCredito({ montoInicial, tasaInteres, numeroCuotas, frecuenciaPago, fechaInicio, redondearCuotaMil = false }) {
  const capital = new Prisma.Decimal(montoInicial)
  const tasa = new Prisma.Decimal(tasaInteres)

  const totalIntereses = capital.times(tasa).dividedBy(100).toDecimalPlaces(0, Prisma.Decimal.ROUND_UP)
  const totalAPagar = capital.plus(totalIntereses)

  function redondearCuota(valor) {
    const alCien = redondearACien(valor)
    return redondearCuotaMil
      ? alCien.dividedBy(1000).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).times(1000)
      : alCien
  }

  const cuotas = Number(numeroCuotas)
  const esSoloIntereses = cuotas === 0
  const diasCobro = DIAS_POR_FRECUENCIA[frecuenciaPago] ?? null

  let valorCuota = null
  let fechaVencimiento = null
  let valorPeriodico = null

  if (esSoloIntereses) {
    valorPeriodico = redondearCuota(totalIntereses)
  } else if (cuotas > 0) {
    valorCuota = redondearCuota(totalAPagar.dividedBy(cuotas))
    if (diasCobro && fechaInicio) {
      fechaVencimiento = new Date(fechaInicio)
      fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCobro * cuotas)
    }
  }

  return { totalIntereses, totalAPagar, valorCuota, fechaVencimiento, esSoloIntereses, valorPeriodico, diasCobro }
}

// Cronograma cuota-a-cuota (fecha, capital, interés, total cuota, saldo) — hoy
// solo lo consume el PDF de "Resumen de préstamo" (src/lib/pdf/resumenPrestamo.js),
// pero queda acá, no en el módulo de PDF, porque es cálculo de negocio, no de
// presentación (misma razón por la que calcularResumenCredito vive acá).
//
// Reparto proporcional en partes iguales (decisión 2026-07-18, confirmada
// contra el mockup de referencia): en un crédito de interés FLAT no existe un
// "saldo insoluto" que recalcular período a período — eso es amortización
// francesa, un modelo financiero distinto al que implementa esta app (ver
// comentario de calcularResumenCredito arriba). Acá cada cuota simplemente
// reparte el interés total y el capital total entre el número de cuotas, en
// partes iguales. El saldo de la tabla SÍ es real: es el capital pendiente,
// decrece en cada fila por el capitalCuota de esa fila y llega a $0 exacto en
// la última.
//
// La última cuota absorbe el residuo de redondeo de las anteriores (mismo
// principio que "el prestamista nunca pierde un peso" de calcularResumenCredito):
// la suma de la columna Capital siempre da exactamente montoInicial, la de
// Interés siempre da exactamente totalIntereses, y la de Total Cuota siempre
// da exactamente totalAPagar.
//
// numeroCuotas = 0 (solo intereses) no tiene cronograma — devuelve [] y el PDF
// muestra el bloque de "valor periódico" en su lugar (ya lo da calcularResumenCredito).
function calcularCronogramaCredito({ montoInicial, tasaInteres, numeroCuotas, frecuenciaPago, fechaInicio, redondearCuotaMil = false }) {
  const cuotas = Number(numeroCuotas)
  if (cuotas <= 0) return []

  const capital = new Prisma.Decimal(montoInicial)
  const { totalIntereses, totalAPagar, valorCuota, diasCobro } = calcularResumenCredito({
    montoInicial, tasaInteres, numeroCuotas, frecuenciaPago, fechaInicio, redondearCuotaMil,
  })

  // Mismo redondeo al 100 más cercano que valorCuota (ver comentario de
  // calcularResumenCredito) — la última cuota sigue absorbiendo el residuo
  // exacto de las anteriores, así que la suma de cada columna nunca pierde
  // ni gana un peso frente al total contractual.
  const interesBase = redondearACien(totalIntereses.dividedBy(cuotas))
  const capitalBase = redondearACien(capital.dividedBy(cuotas))

  let saldo = capital
  let fecha = new Date(fechaInicio)
  const filas = []

  for (let n = 1; n <= cuotas; n++) {
    const esUltima = n === cuotas
    fecha = new Date(fecha)
    if (diasCobro) fecha.setDate(fecha.getDate() + diasCobro)

    const interesCuota = esUltima ? totalIntereses.minus(interesBase.times(cuotas - 1)) : interesBase
    const capitalCuota = esUltima ? capital.minus(capitalBase.times(cuotas - 1)) : capitalBase
    const totalCuota = esUltima ? totalAPagar.minus(valorCuota.times(cuotas - 1)) : valorCuota

    saldo = esUltima ? new Prisma.Decimal(0) : saldo.minus(capitalCuota)

    filas.push({ numero: n, fecha, capital: capitalCuota, interes: interesCuota, totalCuota, saldo })
  }

  return filas
}

// Medianoche de hoy — punto de referencia único para toda comparación de
// "¿ya venció?" en la app (cronograma, mora, próxima cuota). Se usa en vez de
// Date.now() directo para que una cuota que vence HOY MISMO no cuente como
// vencida solo por la hora del día en que se consulta — entra en mora recién
// al día siguiente (decisión del usuario 2026-07-23).
function inicioDeHoy() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// Cuántos períodos completos de frecuenciaPago ya VENCIERON (su fecha de
// cobro quedó estrictamente antes de hoy) desde fechaInicio — base común para
// mora (mora.worker.js), deuda de solo intereses (clientes.service.js) y el
// motor de aplicación de pago (pagos.service.js). El período que se cobra HOY
// mismo todavía no cuenta como transcurrido. Nunca negativo.
function periodosTranscurridosDe({ fechaInicio, frecuenciaPago }) {
  const dias = DIAS_POR_FRECUENCIA[frecuenciaPago]
  if (!dias) return 0
  const periodoMs = dias * 86_400_000
  const diff = inicioDeHoy().getTime() - new Date(fechaInicio).getTime()
  if (diff <= 0) return 0
  // -1ms empuja el caso "hoy cae justo en la fecha de una cuota" hacia abajo
  // (esa cuota se cobra hoy, no cuenta como vencida) sin afectar los demás
  // casos, donde ya faltaba más de un período completo para el próximo corte.
  return Math.floor((diff - 1) / periodoMs)
}

module.exports = { calcularResumenCredito, calcularCronogramaCredito, periodosTranscurridosDe, inicioDeHoy }
