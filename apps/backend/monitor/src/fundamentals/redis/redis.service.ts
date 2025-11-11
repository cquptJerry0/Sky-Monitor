import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name)
    private readonly redis: Redis

    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || 'skyRedis2024',
            retryStrategy: times => {
                if (times > 3) {
                    this.logger.error('Redis connection failed after 3 retries')
                    return null
                }
                return Math.min(times * 100, 2000)
            },
            maxRetriesPerRequest: 3,
        })
    }

    async onModuleInit() {
        try {
            await this.redis.ping()
            this.logger.log('Redis connected successfully')
        } catch (error) {
            this.logger.error('Redis connection failed:', error.message)
            throw error
        }
    }

    getClient(): Redis {
        return this.redis
    }

    async onModuleDestroy() {
        await this.redis.quit()
    }
}
