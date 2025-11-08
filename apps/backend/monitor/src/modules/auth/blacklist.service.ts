import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class BlacklistService implements OnModuleInit {
    private readonly logger = new Logger(BlacklistService.name)
    private readonly redis: Redis

    constructor() {
        this.redis = new Redis({
            host: 'localhost',
            port: 6379,
            password: 'skyRedis2024',
            retryStrategy: times => {
                // Redis 连接失败时，不重试（避免阻塞）
                if (times > 3) {
                    return null
                }
                return Math.min(times * 50, 2000)
            },
            maxRetriesPerRequest: 1,
            lazyConnect: true,
        })
    }

    async onModuleInit() {
        try {
            await this.redis.connect()
        } catch (error) {
            this.logger.warn('Redis connection failed, blacklist features will be disabled:', error.message)
        }
    }

    async addTokenToBlacklist(jti: string, userId: number, ttl: number): Promise<void> {
        const key = `blacklist:token:${jti}`
        await this.redis.setex(key, ttl, userId.toString())
    }

    async addUserToBlacklist(userId: number, ttl: number): Promise<void> {
        const key = `blacklist:user:${userId}`
        await this.redis.setex(key, ttl, Date.now().toString())
    }

    async isTokenBlacklisted(jti: string): Promise<boolean> {
        try {
            if (!this.redis.status || this.redis.status !== 'ready') {
                return false
            }
            const key = `blacklist:token:${jti}`
            const result = await this.redis.exists(key)
            return result === 1
        } catch (error) {
            // Redis 连接失败时，不阻止验证（降级策略）
            this.logger.error('Redis blacklist check failed:', error.message)
            return false
        }
    }

    async isUserBlacklisted(userId: number): Promise<boolean> {
        try {
            if (!this.redis.status || this.redis.status !== 'ready') {
                return false
            }
            const key = `blacklist:user:${userId}`
            const result = await this.redis.exists(key)
            return result === 1
        } catch (error) {
            // Redis 连接失败时，不阻止验证（降级策略）
            this.logger.error('Redis user blacklist check failed:', error.message)
            return false
        }
    }

    async removeUserBlacklist(userId: number): Promise<void> {
        try {
            const key = `blacklist:user:${userId}`
            await this.redis.del(key)
        } catch (error) {
            this.logger.error('Failed to remove user blacklist:', error.message)
        }
    }

    async clearAllBlacklists(): Promise<void> {
        try {
            if (!this.redis.status || this.redis.status !== 'ready') {
                return
            }
            const keys = await this.redis.keys('blacklist:*')
            if (keys.length > 0) {
                await this.redis.del(...keys)
            }
        } catch (error) {
            this.logger.error('Failed to clear blacklists:', error.message)
        }
    }

    async storeRefreshToken(userId: number, jti: string, ttl: number): Promise<void> {
        const key = `refresh:${userId}:${jti}`
        await this.redis.setex(key, ttl, Date.now().toString())
    }

    async isRefreshTokenValid(userId: number, jti: string): Promise<boolean> {
        try {
            const key = `refresh:${userId}:${jti}`
            const result = await this.redis.exists(key)
            return result === 1
        } catch (error) {
            this.logger.error('Redis refresh token check failed:', error.message)
            return false
        }
    }

    async removeRefreshToken(userId: number, jti: string): Promise<void> {
        const key = `refresh:${userId}:${jti}`
        await this.redis.del(key)
    }

    async onModuleDestroy() {
        await this.redis.quit()
    }
}
