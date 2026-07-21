'use strict'

const { Worker } = require('bullmq')
const { Prisma } = require('@prisma/client')
const { redisConfig } = require('../../lib/redis')
const prisma = require('../../lib/prisma')
const { registrarAuditoria } = require('../../lib/auditoria')
const { ESTADOS_CREDITO_ACTIVOS, DIAS_POR_FRECUENCIA } = require('../../lib/creditosConstantes')
const { calcularResumenCredito, calcularCronogramaCredito } = require('../../lib/calculoCredito')

// Estado real de un crédito según lo que debería estar pagado a HOY (cronograma
// contractual) vs. lo que realmente se ha abonado a capital + intereses —
// sin días de gracia (decisión 2026-07-20: ese motor no está configurado para
// casi ningún tenant todavía, ver src/lib/configMora.js). Reversible: si el
// abono ya cubre lo esperado, vuelve a ACTIVO solo, sin intervención manual.
//
// VENCIDO es exclusivo de créditos con plazo fijo (numeroCuotas > 0) cuyo plazo
// completo ya expiró con saldo pendiente. Solo intereses (numeroCuotas = 0, sin
// fechaVencimiento) como mucho llega a EN_MORA — nunca VENCIDO.
function calcularEstadoMoraDe(credito, montoPagado) {
  const dias = DIAS_POR_FRECUENCIA[credito.frecuenciaPago]
  if (!dias) return 'ACTIVO'

  const periodosTranscurridos = Math.floor(
    (Date.now() - new Date(credito.fechaInicio).getTime()) / (dias * 86_400_000)
  )

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

async function procesarMoraCreditos() {
  console.log('[Mora] Iniciando cálculo...')

  const creditos = await prisma.credito.findMany({
    where: { estado: { in: ESTADOS_CREDITO_ACTIVOS } },
    select: {
      id: true, tenantId: true, montoInicial: true, tasaInteres: true,
      numeroCuotas: true, frecuenciaPago: true, fechaInicio: true,
      redondearCuotaMil: true, estado: true,
    },
  })

  console.log(`[Mora] Evaluando ${creditos.length} créditos activos`)

  const creditoIds = creditos.map(c => c.id)
  const abonos = creditoIds.length === 0 ? [] : await prisma.distribucionPago.groupBy({
    by: ['creditoId'],
    where: { creditoId: { in: creditoIds } },
    _sum: { valorCapital: true, valorIntereses: true },
  })
  const abonoPorCredito = new Map(
    abonos.map(a => [a.creditoId, new Prisma.Decimal(a._sum.valorCapital ?? 0).plus(a._sum.valorIntereses ?? 0)])
  )

  // Procesar en lotes para no saturar la BD — mismo patrón que actividadTenants.worker.js.
  const LOTE = 20
  let actualizados = 0
  let errores = 0

  for (let i = 0; i < creditos.length; i += LOTE) {
    const lote = creditos.slice(i, i + LOTE)

    await Promise.all(
      lote.map(async credito => {
        try {
          const montoPagado = abonoPorCredito.get(credito.id) ?? new Prisma.Decimal(0)
          const nuevoEstado = calcularEstadoMoraDe(credito, montoPagado)
          if (nuevoEstado === credito.estado) return

          await prisma.credito.update({ where: { id: credito.id }, data: { estado: nuevoEstado } })

          await registrarAuditoria({
            tenantId: credito.tenantId,
            accion: 'CREDITO_CAMBIO_ESTADO_MORA',
            entidadTipo: 'Credito',
            entidadId: credito.id,
            valorAnterior: { estado: credito.estado },
            valorNuevo: { estado: nuevoEstado },
            metadata: { automatico: true, origen: 'job-mora-diaria' },
          })

          actualizados++
        } catch (err) {
          errores++
          console.error(`[Mora] Error en crédito ${credito.id}:`, err.message)
        }
      })
    )
  }

  const resumen = `actualizados=${actualizados} errores=${errores} total=${creditos.length}`
  console.log(`[Mora] Completado — ${resumen}`)
  return resumen
}

function crearWorkerMora() {
  const worker = new Worker(
    'mora',
    async job => {
      if (job.name === 'calcular-mora') {
        return await procesarMoraCreditos()
      }
    },
    { connection: redisConfig, concurrency: 1 }
  )

  worker.on('completed', (job, result) => {
    console.log(`[Mora] Job ${job.id} completado — ${result}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Mora] Job ${job?.id} falló:`, err.message)
  })

  return worker
}

module.exports = { crearWorkerMora, procesarMoraCreditos, calcularEstadoMoraDe }
