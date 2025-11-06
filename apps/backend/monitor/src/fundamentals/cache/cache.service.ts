import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import Redis from 'ioredis'

/**
 * Redis 缓存服务
 *
 * @description
 * 统一封装 Redis 操作，提供简洁的缓存接口。
 * 支持自动降级，Redis 不可用时不影响业务。
 */
@Injectable()
export class CacheService implements OnModuleInit {
    private readonly logger = new Logger(CacheService.name)
    private redis: Redis

    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || 'skyRedis2024',
            retryStrategy: times => {
                const delay = Math.min(times * 50, 2000)
                return delay
            },
            maxRetriesPerRequest: 3,
        })
    }

    async onModuleInit() {
        try {
            await this.redis.connect()
            this.logger.log('Redis connected successfully')
        } catch (error: any) {
            this.logger.warn(`Redis connection failed: ${error.message}`)
            this.logger.warn('Cache service will operate in degraded mode')
        }
    }

    /**
     * 检查 Redis 是否可用
     */
    isReady(): boolean {
        return this.redis.status === 'ready'
    }

    /**
     * 获取缓存值
     */
    async get(key: string): Promise<string | null> {
        try {
            if (!this.isReady()) {
                return null
            }
            return await this.redis.get(key)
        } catch (error: any) {
            this.logger.warn(`Failed to get cache key ${key}: ${error.message}`)
            return null
        }
    }

    /**
     * 设置缓存值
     */
    async set(key: string, value: string): Promise<void> {
        try {
            if (!this.isReady()) {
                return
            }
            await this.redis.set(key, value)
        } catch (error: any) {
            this.logger.warn(`Failed to set cache key ${key}: ${error.message}`)
        }
    }

    /**
     * 设置缓存值（带过期时间）
     */
    async setex(key: string, ttl: number, value: string): Promise<void> {
        try {
            if (!this.isReady()) {
                return
            }
            await this.redis.setex(key, ttl, value)
        } catch (error: any) {
            this.logger.warn(`Failed to setex cache key ${key}: ${error.message}`)
        }
    }

    /**
     * 删除缓存值
     */
    async del(key: string): Promise<void> {
        try {
            if (!this.isReady()) {
                return
            }
            await this.redis.del(key)
        } catch (error: any) {
            this.logger.warn(`Failed to delete cache key ${key}: ${error.message}`)
        }
    }

    /**
     * 检查键是否存在
     */
    async exists(key: string): Promise<boolean> {
        try {
            if (!this.isReady()) {
                return false
            }
            const result = await this.redis.exists(key)
            return result === 1
        } catch (error: any) {
            this.logger.warn(`Failed to check existence of key ${key}: ${error.message}`)
            return false
        }
    }

    /**
     * 列表：左推入
     */
    async lpush(key: string, value: string): Promise<void> {
        try {
            if (!this.isReady()) {
                return
            }
            await this.redis.lpush(key, value)
        } catch (error: any) {
            this.logger.warn(`Failed to lpush to key ${key}: ${error.message}`)
        }
    }

    /**
     * 列表：获取范围
     */
    async lrange(key: string, start: number, end: number): Promise<string[]> {
        try {
            if (!this.isReady()) {
                return []
            }
            return await this.redis.lrange(key, start, end)
        } catch (error: any) {
            this.logger.warn(`Failed to lrange key ${key}: ${error.message}`)
            return []
        }
    }

    /**
     * 列表：修剪
     */
    async ltrim(key: string, start: number, end: number): Promise<void> {
        try {
            if (!this.isReady()) {
                return
            }
            await this.redis.ltrim(key, start, end)
        } catch (error: any) {
            this.logger.warn(`Failed to ltrim key ${key}: ${error.message}`)
        }
    }

    /**
     * 获取 Redis 实例（高级用法）
     */
    getClient(): Redis {
        return this.redis
    }
}
