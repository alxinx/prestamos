'use strict'

const { Worker } = require('bullmq')
const { redisConfig } = require('../../lib/redis')
const prisma = require('../../lib/prisma')
const { ESTADOS_CREDITO_ACTIVOS } = require('../../lib/creditosConstantes')

function hace30Dias() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d
}

function inicioMesActual() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function calcularEngagement({ pagosUltimos30Dias, prestamosActivos, ultimoPagoRegistrado, ultimoPrestamoCreado }) {
  // Tiene cobros activos en el último mes → usa el software productivamente
  if (pagosUltimos30Dias > 0) return 'ACTIVO'

  // Tiene cartera activa pero sin cobros recientes → puede estar en riesgo de abandono
  if (prestamosActivos > 0) return 'EN_RIESGO'

  // Sin cartera ni cobros en 30 días → inactivo
  return 'INACTIVO'
}

async function calcularMetricasTenant(tenantId) {
  const limite30 = hace30Dias()
  const inicioMes = inicioMesActual()

  const [
    ultimoPago,
    ultimoPrestamo,
    ultimoCierre,
    pagosUltimos30Dias,
    prestamosActivos,
    prestamosCreados_mes,
  ] = await Promise.all([
    // Último pago registrado (no anulado)
    prisma.pago.findFirst({
      where: { tenantId, estado: { not: 'ANULADO' } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),

    // Último préstamo creado
    prisma.credito.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),

    // Último cierre de caja global
    prisma.cierreCajaGlobal.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),

    // Pagos en los últimos 30 días
    prisma.pago.count({
      where: {
        tenantId,
        estado: { not: 'ANULADO' },
        createdAt: { gte: limite30 },
      },
    }),

    // Préstamos con cartera abierta
    prisma.credito.count({
      where: {
        tenantId,
        estado: { in: ESTADOS_CREDITO_ACTIVOS },
      },
    }),

    // Préstamos creados en el mes actual
    prisma.credito.count({
      where: {
        tenantId,
        createdAt: { gte: inicioMes },
      },
    }),
  ])

  const estadoEngagement = calcularEngagement({
    pagosUltimos30Dias,
    prestamosActivos,
    ultimoPagoRegistrado: ultimoPago?.createdAt ?? null,
    ultimoPrestamoCreado: ultimoPrestamo?.createdAt ?? null,
  })

  return {
    tenantId,
    ultimoPagoRegistrado:  ultimoPago?.createdAt    ?? null,
    ultimoPrestamoCreado:  ultimoPrestamo?.createdAt ?? null,
    ultimoCierreCaja:      ultimoCierre?.createdAt   ?? null,
    ultimoLogin:           null, // se llenará cuando exista tracking de sesiones
    pagosUltimos30Dias,
    prestamosActivos,
    prestamosCreados_mes,
    estadoEngagement,
    fechaCalculo: new Date(),
  }
}

async function procesarActividadTenants() {
  console.log('[ActividadTenants] Iniciando cálculo...')

  const tenants = await prisma.tenant.findMany({
    where: { estado: { in: ['ACTIVO', 'PERIODO_GRACIA'] } },
    select: { id: true, nombreNegocio: true },
  })

  console.log(`[ActividadTenants] Procesando ${tenants.length} tenants`)

  // Procesar en lotes de 10 para no saturar la BD
  const LOTE = 10
  let procesados = 0
  let errores = 0

  for (let i = 0; i < tenants.length; i += LOTE) {
    const lote = tenants.slice(i, i + LOTE)

    await Promise.all(
      lote.map(async (tenant) => {
        try {
          const metricas = await calcularMetricasTenant(tenant.id)

          const camposActividad = {
            ultimoPagoRegistrado: metricas.ultimoPagoRegistrado,
            ultimoPrestamoCreado: metricas.ultimoPrestamoCreado,
            ultimoCierreCaja:     metricas.ultimoCierreCaja,
            ultimoLogin:          metricas.ultimoLogin,
            pagosUltimos30Dias:   metricas.pagosUltimos30Dias,
            prestamosActivos:     metricas.prestamosActivos,
            prestamosCreados_mes: metricas.prestamosCreados_mes,
            estadoEngagement:     metricas.estadoEngagement,
            fechaCalculo:         metricas.fechaCalculo,
          }

          await prisma.tenantActividadResumen.upsert({
            where:  { tenantId: tenant.id },
            update: camposActividad,
            create: { tenantId: metricas.tenantId, ...camposActividad },
          })

          procesados++
        } catch (err) {
          errores++
          console.error(`[ActividadTenants] Error en tenant ${tenant.nombreNegocio}:`, err.message)
        }
      })
    )
  }

  const resumen = `procesados=${procesados} errores=${errores} total=${tenants.length}`
  console.log(`[ActividadTenants] Completado — ${resumen}`)
  return resumen
}

function crearWorkerActividad() {
  const worker = new Worker(
    'actividad-tenants',
    async (job) => {
      if (job.name === 'calcular-actividad') {
        return await procesarActividadTenants()
      }
    },
    { connection: redisConfig, concurrency: 1 }
  )

  worker.on('completed', (job, result) => {
    console.log(`[ActividadTenants] Job ${job.id} completado — ${result}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[ActividadTenants] Job ${job?.id} falló:`, err.message)
  })

  return worker
}

module.exports = { crearWorkerActividad, procesarActividadTenants }
