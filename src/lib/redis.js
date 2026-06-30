const Redis = require('ioredis')

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  maxRetriesPerRequest: null, // requerido por BullMQ
}

const redis = new Redis(redisConfig)

redis.on('error', (err) => {
  console.error('[Redis] Error de conexión:', err.message)
})

redis.on('connect', () => {
  console.log('[Redis] Conectado')
})

module.exports = { redis, redisConfig }
