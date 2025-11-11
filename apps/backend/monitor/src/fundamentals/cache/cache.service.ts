import { Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'

import { RedisService } from '../redis'

/**
 * Redis 缓存服务
 *
 * @description
 * 统一封装 Redis 操作，提供简洁的缓存接口。
 */
@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name)
    private redis: Redis

    constructor(private readonly redisService: RedisService) {
        this.redis = this.redisService.getClient()
    }

    /**
     * 获取缓存值
     */
    async get(key: string): Promise<string | null> {
        return await this.redis.get(key)
    }

    /**
     * 设置缓存值
     */
    async set(key: string, value: string): Promise<void> {
        await this.redis.set(key, value)
    }

    /**
     * 设置缓存值（带过期时间）
     */
    async setex(key: string, ttl: number, value: string): Promise<void> {
        await this.redis.setex(key, ttl, value)
    }

    /**
     * 删除缓存值
     */
    async del(key: string): Promise<void> {
        await this.redis.del(key)
    }

    /**
     * 检查键是否存在
     */
    async exists(key: string): Promise<boolean> {
        const result = await this.redis.exists(key)
        return result === 1
    }

    /**
     * 列表：左推入
     */
    async lpush(key: string, value: string): Promise<void> {
        await this.redis.lpush(key, value)
    }

    /**
     * 列表：获取范围
     */
    async lrange(key: string, start: number, end: number): Promise<string[]> {
        return await this.redis.lrange(key, start, end)
    }

    /**
     * 列表：修剪
     */
    async ltrim(key: string, start: number, end: number): Promise<void> {
        await this.redis.ltrim(key, start, end)
    }

    /**
     * 获取 Redis 实例（高级用法）
     */
    getClient(): Redis {
        return this.redis
    }
}
