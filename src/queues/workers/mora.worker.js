'use strict'

const { Worker } = require('bullmq')
const { Prisma } = require('@prisma/client')
const { redisConfig } = require('../../lib/redis')
const prisma = require('../../lib/prisma')
const { registrarAuditoria } = require('../../lib/auditoria')
const { ESTADOS_CREDITO_ACTIVOS } = require('../../lib/creditosConstantes')
const { calcularEstadoMoraDe } = require('../../lib/calculoMora')
const { abonosPorCreditoDe } = require('../../modules/tenant/creditos/creditos.service')

async function procesarMoraTenant(tenant) {
  const creditos = await prisma.credito.findMany({
    where: { tenantId: tenant.id, estado: { in: ESTADOS_CREDITO_ACTIVOS } },
    select: {
      id: true, tenantId: true, montoInicial: true, tasaInteres: true,
      numeroCuotas: true, frecuenciaPago: true, fechaInicio: true,
      redondearCuotaMil: true, estado: true,
    },
  })
  if (creditos.length === 0) return { actualizados: 0, errores: 0, total: 0 }

  const creditoIds = creditos.map(c => c.id)
  // abonosPorCreditoDe ya filtra pago.estado='LIQUIDADO' — un pago apenas
  // registrado (PENDIENTE_LIQUIDAR) no debe adelantar el estado del crédito
  // (CLAUDE.md §7).
  const abonoPorCredito = await abonosPorCreditoDe(tenant.id, creditoIds)

  let actualizados = 0
  let errores = 0

  for (const credito of creditos) {
    try {
      const abono = abonoPorCredito.get(credito.id)
      const montoPagado = new Prisma.Decimal(abono?.valorCapital ?? 0).plus(abono?.valorIntereses ?? 0)
      const nuevoEstado = calcularEstadoMoraDe(credito, montoPagado)

      if (nuevoEstado !== credito.estado) {
        await prisma.credito.updateMany({ where: { id: credito.id, tenantId: tenant.id }, data: { estado: nuevoEstado } })

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
      }
    } catch (err) {
      errores++
      console.error(`[Mora] Error en crédito ${credito.id} (tenant ${tenant.id}):`, err.message)
    }
  }

  return { actualizados, errores, total: creditos.length }
}

async function procesarMoraCreditos() {
  console.log('[Mora] Iniciando cálculo...')

  const tenants = await prisma.tenant.findMany({
    where: { estado: { in: ['ACTIVO', 'PERIODO_GRACIA'] } },
    select: { id: true },
  })

  let actualizados = 0
  let errores = 0
  let total = 0

  // Un tenant a la vez — el volumen esperado (CLAUDE.md: ~100 tenants,
  // ~150 créditos c/u) no justifica paralelizar y complicar el manejo de
  // errores por tenant.
  for (const tenant of tenants) {
    const resultado = await procesarMoraTenant(tenant)
    actualizados += resultado.actualizados
    errores += resultado.errores
    total += resultado.total
  }

  const resumen = `actualizados=${actualizados} errores=${errores} total=${total}`
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

module.exports = { crearWorkerMora, procesarMoraCreditos }
