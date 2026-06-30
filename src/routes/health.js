const { Router } = require('express')
const prisma = require('../lib/prisma')
const { redis } = require('../lib/redis')

const router = Router()

router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    const redisPing = await redis.ping()

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        redis: redisPing === 'PONG' ? 'ok' : 'error',
      },
    })
  } catch (err) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Servicio no disponible',
    })
  }
})

module.exports = router
