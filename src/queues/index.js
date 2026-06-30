const { Queue } = require('bullmq')
const { redisConfig } = require('../lib/redis')

const queueOpts = { connection: redisConfig }

const moraQueue = new Queue('mora', queueOpts)
const notificacionesQueue = new Queue('notificaciones', queueOpts)
const scoreQueue = new Queue('score', queueOpts)
const cierreQueue = new Queue('cierre', queueOpts)

async function registrarJobsRecurrentes() {
  await moraQueue.upsertJobScheduler(
    'calcular-mora-diaria',
    { pattern: process.env.QUEUE_MORA_CRON || '0 1 * * *' },
    { name: 'calcular-mora', data: {} }
  )
  await notificacionesQueue.upsertJobScheduler(
    'enviar-recordatorios',
    { pattern: process.env.QUEUE_NOTIFICACIONES_CRON || '0 8 * * *' },
    { name: 'recordatorio-pago', data: {} }
  )
  await scoreQueue.upsertJobScheduler(
    'recalcular-scores',
    { pattern: process.env.QUEUE_SCORE_CRON || '0 2 * * *' },
    { name: 'recalcular-score', data: {} }
  )
  await cierreQueue.upsertJobScheduler(
    'verificar-cierres',
    { pattern: process.env.QUEUE_CIERRE_CRON || '0 0 * * *' },
    { name: 'verificar-cierre', data: {} }
  )
}

module.exports = {
  moraQueue,
  notificacionesQueue,
  scoreQueue,
  cierreQueue,
  registrarJobsRecurrentes,
}
