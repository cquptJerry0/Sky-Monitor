import { Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'

import { RedisService } from '../../fundamentals/redis'

@Injectable()
export class BlacklistService {
    private readonly logger = new Logger(BlacklistService.name)
    private readonly redis: Redis

    constructor(private readonly redisService: RedisService) {
        this.redis = this.redisService.getClient()
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
        const key = `blacklist:token:${jti}`
        const result = await this.redis.exists(key)
        return result === 1
    }

    async isUserBlacklisted(userId: number): Promise<boolean> {
        const key = `blacklist:user:${userId}`
        const result = await this.redis.exists(key)
        return result === 1
    }

    async removeUserBlacklist(userId: number): Promise<void> {
        const key = `blacklist:user:${userId}`
        await this.redis.del(key)
    }

    async clearAllBlacklists(): Promise<void> {
        const keys = await this.redis.keys('blacklist:*')
        if (keys.length > 0) {
            await this.redis.del(...keys)
        }
    }

    async storeRefreshToken(userId: number, jti: string, ttl: number): Promise<void> {
        const key = `refresh:${userId}:${jti}`
        await this.redis.setex(key, ttl, Date.now().toString())
    }

    async isRefreshTokenValid(userId: number, jti: string): Promise<boolean> {
        const key = `refresh:${userId}:${jti}`
        const result = await this.redis.exists(key)
        return result === 1
    }

    async removeRefreshToken(userId: number, jti: string): Promise<void> {
        const key = `refresh:${userId}:${jti}`
        await this.redis.del(key)
    }

    /**
     * 清理用户的所有 refresh token
     * 用于：全局登出时清理所有设备的 refresh token
     */
    async clearUserRefreshTokens(userId: number): Promise<void> {
        const pattern = `refresh:${userId}:*`
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
            await this.redis.del(...keys)
            this.logger.log(`已清理用户 ${userId} 的 ${keys.length} 个 refresh token`)
        }
    }
}
