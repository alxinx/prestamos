'use strict'

const { Prisma } = require('@prisma/client')
const { DIAS_POR_FRECUENCIA } = require('./creditosConstantes')
const { calcularResumenCredito, calcularCronogramaCredito, periodosTranscurridosDe, inicioDeHoy } = require('./calculoCredito')

// Estado real de un crédito según lo que debería estar pagado a HOY (cronograma
// contractual) vs. lo que realmente se ha abonado a capital + intereses —
// sin días de gracia (decisión 2026-07-20: ese motor no está configurado para
// casi ningún tenant todavía, ver src/lib/configMora.js). Reversible: si el
// abono ya cubre lo esperado, vuelve a ACTIVO solo, sin intervención manual.
// Fuente única — la usan src/queues/workers/mora.worker.js (job diario) y
// src/modules/tenant/pagos/pagos.service.js (al liquidar un pago), para no
// divergir en qué cuenta como "al día".
//
// VENCIDO es exclusivo de créditos con plazo fijo (numeroCuotas > 0) cuyo plazo
// completo ya expiró con saldo pendiente. Solo intereses (numeroCuotas = 0, sin
// fechaVencimiento) como mucho llega a EN_MORA — nunca VENCIDO.
function calcularEstadoMoraDe(credito, montoPagado) {
  const dias = DIAS_POR_FRECUENCIA[credito.frecuenciaPago]
  if (!dias) return 'ACTIVO'

  const periodosTranscurridos = periodosTranscurridosDe(credito)

  if (credito.numeroCuotas === 0) {
    if (periodosTranscurridos <= 0) return 'ACTIVO'
    const { valorPeriodico } = calcularResumenCredito({
      montoInicial: credito.montoInicial,
      tasaInteres: credito.tasaInteres,
      numeroCuotas: 0,
      frecuenciaPago: credito.frecuenciaPago,
      fechaInicio: credito.fechaInicio,
      redondearCuotaMil: credito.redondearCuotaMil,
    })
    const interesEsperado = valorPeriodico.times(periodosTranscurridos)
    return montoPagado.gte(interesEsperado) ? 'ACTIVO' : 'EN_MORA'
  }

  const cuotasVencidas = Math.min(Math.max(periodosTranscurridos, 0), credito.numeroCuotas)
  if (cuotasVencidas === 0) return 'ACTIVO'

  const cronograma = calcularCronogramaCredito({
    montoInicial: credito.montoInicial,
    tasaInteres: credito.tasaInteres,
    numeroCuotas: credito.numeroCuotas,
    frecuenciaPago: credito.frecuenciaPago,
    fechaInicio: credito.fechaInicio,
    redondearCuotaMil: credito.redondearCuotaMil,
  })
  const montoEsperado = cronograma
    .slice(0, cuotasVencidas)
    .reduce((acc, fila) => acc.plus(fila.totalCuota), new Prisma.Decimal(0))

  if (montoPagado.gte(montoEsperado)) return 'ACTIVO'
  return cuotasVencidas >= credito.numeroCuotas ? 'VENCIDO' : 'EN_MORA'
}

// Fecha aproximada desde la que un crédito EN_MORA/VENCIDO lleva sin pagar —
// la primera cuota (o, en solo intereses, el primer período) del cronograma
// contractual cuyo acumulado esperado todavía no cubre lo realmente pagado.
// Reusa calcularCronogramaCredito/calcularResumenCredito (fuente única de la
// fórmula, igual que el resto de la app) en vez de reimplementar el cálculo de
// cuotas. Null si el crédito no está en mora. Usada por el motor de acumulación
// de mora en pesos (mora.worker.js/acumularMoraSiCorresponde).
function fechaInicioMoraDe(credito, montoPagado) {
  const dias = DIAS_POR_FRECUENCIA[credito.frecuenciaPago]
  if (!dias) return null

  if (credito.numeroCuotas === 0) {
    const { valorPeriodico } = calcularResumenCredito({
      montoInicial: credito.montoInicial,
      tasaInteres: credito.tasaInteres,
      numeroCuotas: 0,
      frecuenciaPago: credito.frecuenciaPago,
      fechaInicio: credito.fechaInicio,
      redondearCuotaMil: credito.redondearCuotaMil,
    })
    const periodosTranscurridos = periodosTranscurridosDe(credito)
    for (let i = 1; i <= periodosTranscurridos; i++) {
      if (montoPagado.lt(valorPeriodico.times(i))) {
        const fecha = new Date(credito.fechaInicio)
        fecha.setDate(fecha.getDate() + dias * i)
        return fecha
      }
    }
    return null
  }

  const cronograma = calcularCronogramaCredito({
    montoInicial: credito.montoInicial,
    tasaInteres: credito.tasaInteres,
    numeroCuotas: credito.numeroCuotas,
    frecuenciaPago: credito.frecuenciaPago,
    fechaInicio: credito.fechaInicio,
    redondearCuotaMil: credito.redondearCuotaMil,
  })
  let acumulado = new Prisma.Decimal(0)
  const hoyMs = inicioDeHoy().getTime()
  for (const fila of cronograma) {
    // La cuota que se cobra HOY todavía no cuenta como vencida.
    if (fila.fecha.getTime() >= hoyMs) break
    acumulado = acumulado.plus(fila.totalCuota)
    if (montoPagado.lt(acumulado)) return fila.fecha
  }
  return null
}

// Mora de CADA cuota del cronograma, calculada en vivo (nunca persistida,
// CLAUDE.md §4) sobre el valor ORIGINAL de esa cuota (interés o capital según
// baseCalculoMora) — NUNCA sobre el saldo actual, incluso si esa cuota ya
// tiene ese valor pagado con un abono anterior. Regla explícita del usuario
// (2026-07-23): pagar el interés de una cuota atrasada no debe "borrar" la
// mora que ya se causó por haberla pagado tarde. Devuelve un array alineado
// 1:1 con `cronograma` (mismo orden, mismo largo). $0 en toda cuota que no
// alcanzó los días de gracia o cuya fecha todavía no vence.
function moraPorCuotaDe(cronograma, config) {
  if (!config.activo) return cronograma.map(() => new Prisma.Decimal(0))

  const hoy = inicioDeHoy().getTime()
  return cronograma.map(fila => {
    const diasAtraso = Math.floor((hoy - fila.fecha.getTime()) / 86_400_000)
    const diasEnMora = Math.max(0, diasAtraso - config.diasGracia)
    if (diasEnMora <= 0) return new Prisma.Decimal(0)

    const base = config.base === 'CAPITAL' ? fila.capital : fila.interes
    return base.times(config.porcentaje).dividedBy(100).times(diasEnMora)
  })
}

module.exports = { calcularEstadoMoraDe, fechaInicioMoraDe, moraPorCuotaDe }
