import Redis from 'ioredis'
import logger from '../utils/logger'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

redis.on('connect', () => {
    logger.info('Connected to Redis')
})

redis.on('error', (err) => {
    logger.error('Redis connection error', { error: err })
})

export default redis
