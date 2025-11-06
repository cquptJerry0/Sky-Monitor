import { Injectable, Logger } from '@nestjs/common'
import { InjectConnection } from '@nestjs/typeorm'
import { Connection } from 'typeorm'
import Redis from 'ioredis'

import { ClickhouseInitService } from '../../fundamentals/clickhouse/clickhouse-init.service'

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name)
    private readonly redis: Redis

    constructor(
        @InjectConnection() private readonly connection: Connection,
        private readonly clickhouseInitService: ClickhouseInitService
    ) {
        // 创建 Redis 客户端用于健康检查
        this.redis = new Redis({
            host: 'localhost',
            port: 6379,
            password: 'skyRedis2024',
            maxRetriesPerRequest: 1,
            retryStrategy: () => null,
            lazyConnect: true,
        })
    }

    /**
     * 获取系统健康状态
     */
    async getSystemHealth() {
        try {
            const uptime = process.uptime()
            const memoryUsage = process.memoryUsage()

            return {
                status: 'ok',
                uptime: Math.floor(uptime),
                memory: {
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
                    rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
                },
                timestamp: new Date().toISOString(),
            }
        } catch (error) {
            this.logger.error(`Failed to get system health: ${error.message}`)
            return {
                status: 'error',
                error: error.message,
            }
        }
    }

    /**
     * 检查 PostgreSQL 连接状态
     */
    async checkPostgreSQL(): Promise<{ connected: boolean; latency?: number; error?: string }> {
        try {
            const startTime = Date.now()
            await this.connection.query('SELECT 1')
            const latency = Date.now() - startTime

            return {
                connected: true,
                latency,
            }
        } catch (error) {
            this.logger.error(`PostgreSQL health check failed: ${error.message}`)
            return {
                connected: false,
                error: error.message,
            }
        }
    }

    /**
     * 检查 Redis 连接状态
     */
    async checkRedis(): Promise<{ connected: boolean; latency?: number; error?: string }> {
        try {
            // 如果未连接，尝试连接
            if (this.redis.status !== 'ready') {
                await this.redis.connect()
            }

            const startTime = Date.now()
            await this.redis.ping()
            const latency = Date.now() - startTime

            return {
                connected: true,
                latency,
            }
        } catch (error) {
            this.logger.error(`Redis health check failed: ${error.message}`)
            return {
                connected: false,
                error: error.message,
            }
        }
    }

    /**
     * 检查 ClickHouse 连接状态
     */
    async checkClickHouse(): Promise<{ connected: boolean; latency?: number; error?: string }> {
        try {
            const startTime = Date.now()
            const isHealthy = await this.clickhouseInitService.healthCheck()
            const latency = Date.now() - startTime

            return {
                connected: isHealthy,
                latency: isHealthy ? latency : undefined,
                error: isHealthy ? undefined : 'ClickHouse connection failed',
            }
        } catch (error) {
            this.logger.error(`ClickHouse health check failed: ${error.message}`)
            return {
                connected: false,
                error: error.message,
            }
        }
    }

    /**
     * 获取所有依赖服务的健康状态
     */
    async getAllDependenciesHealth() {
        const [postgresql, redis, clickhouse] = await Promise.allSettled([
            this.checkPostgreSQL(),
            this.checkRedis(),
            this.checkClickHouse(),
        ])

        return {
            postgresql: postgresql.status === 'fulfilled' ? postgresql.value : { connected: false, error: postgresql.reason?.message },
            redis: redis.status === 'fulfilled' ? redis.value : { connected: false, error: redis.reason?.message },
            clickhouse: clickhouse.status === 'fulfilled' ? clickhouse.value : { connected: false, error: clickhouse.reason?.message },
        }
    }

    /**
     * 清理资源
     */
    async onModuleDestroy() {
        try {
            await this.redis.quit()
        } catch (error) {
            // 忽略清理错误
        }
    }
}
