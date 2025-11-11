import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'

import { RedisService } from '../../../fundamentals/redis'

/**
 * 错误趋势分析服务
 *
 * @description
 * 负责错误趋势分析、对比和突增检测。
 */
@Injectable()
export class ErrorTrendsService {
    private readonly logger = new Logger(ErrorTrendsService.name)
    private readonly redis: Redis

    constructor(
        @Inject('CLICKHOUSE_CLIENT') private clickhouseClient: ClickHouseClient,
        private readonly redisService: RedisService
    ) {
        this.redis = this.redisService.getClient()
    }

    /**
     * 获取错误趋势分析
     *
     * @description
     * 按时间窗口统计错误发生次数，生成趋势图数据。
     * 支持多种时间粒度：小时、天、周。
     */
    async getErrorTrends(params: { appId: string; fingerprint?: string; window: 'hour' | 'day' | 'week'; limit?: number }) {
        try {
            const { appId, fingerprint, window, limit = 100 } = params

            const timeFunction = this.getTimeWindowFunction(window)

            const whereConditions = [`app_id = '${appId}'`, `event_type = 'error'`]

            if (fingerprint) {
                whereConditions.push(`error_fingerprint = '${fingerprint}'`)
            }

            const whereClause = whereConditions.join(' AND ')

            const query = `
                SELECT 
                    ${timeFunction}(timestamp) as time_bucket,
                    COUNT(*) as count,
                    SUM(dedup_count) as total_occurrences,
                    uniq(user_id) as affected_users,
                    uniq(session_id) as affected_sessions
                FROM monitor_events
                WHERE ${whereClause}
                GROUP BY time_bucket
                ORDER BY time_bucket DESC
                LIMIT ${limit}
            `

            const result = await this.clickhouseClient.query({ query })
            const data = await result.json()

            const trendData = (data.data as any[]).reverse()

            const stats = {
                totalCount: trendData.reduce((sum, item) => sum + parseInt(item.count || 0), 0),
                totalOccurrences: trendData.reduce((sum, item) => sum + parseInt(item.total_occurrences || 0), 0),
                peakCount: Math.max(...trendData.map(item => parseInt(item.count || 0))),
                peakTime: trendData.reduce(
                    (peak, item) => (parseInt(item.count || 0) > parseInt(peak.count || 0) ? item : peak),
                    trendData[0]
                ),
            }

            this.logger.log(`Error trends fetched for app: ${appId}, window: ${window}, data points: ${trendData.length}`)

            return {
                data: trendData,
                window,
                stats,
                totalDataPoints: trendData.length,
            }
        } catch (error: any) {
            this.logger.error(`Failed to get error trends: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取多个错误的对比趋势
     *
     * @description
     * 在同一时间轴上对比多个错误指纹的趋势。
     */
    async compareErrorTrends(params: { appId: string; fingerprints: string[]; window: 'hour' | 'day' | 'week'; limit?: number }) {
        try {
            const { appId, fingerprints, window, limit = 100 } = params

            if (fingerprints.length > 10) {
                throw new Error('Maximum 10 fingerprints allowed for comparison')
            }

            const trendsPromises = fingerprints.map(fingerprint => this.getErrorTrends({ appId, fingerprint, window, limit }))

            const trendsResults = await Promise.all(trendsPromises)

            const allTimeBuckets = new Set<string>()
            trendsResults.forEach(result => {
                result.data.forEach((item: any) => {
                    allTimeBuckets.add(item.time_bucket)
                })
            })

            const sortedTimeBuckets = Array.from(allTimeBuckets).sort()

            const comparisonData = sortedTimeBuckets.map(timeBucket => {
                const dataPoint: any = { time_bucket: timeBucket }

                fingerprints.forEach((fingerprint, index) => {
                    const trendData = trendsResults[index].data.find((item: any) => item.time_bucket === timeBucket)
                    dataPoint[`error_${index + 1}`] = trendData ? parseInt(trendData.count || 0) : 0
                    dataPoint[`error_${index + 1}_occurrences`] = trendData ? parseInt(trendData.total_occurrences || 0) : 0
                })

                return dataPoint
            })

            return {
                data: comparisonData,
                fingerprints,
                window,
                individualStats: trendsResults.map(r => r.stats),
            }
        } catch (error: any) {
            this.logger.error(`Failed to compare error trends: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 检测错误突增（异常峰值检测）
     *
     * @description
     * 通过统计分析检测错误数量的异常突增。
     * 算法：当前值 > 平均值 + 2*标准差 且 > 平均值 * 1.5
     */
    async detectErrorSpikes(params: { appId: string; window?: 'hour' | 'day'; lookback?: number }) {
        try {
            const { appId, window = 'hour', lookback = 24 } = params

            const timeFunction = this.getTimeWindowFunction(window)

            const query = `
                SELECT 
                    ${timeFunction}(timestamp) as time_bucket,
                    COUNT(*) as error_count
                FROM monitor_events
                WHERE app_id = '${appId}' 
                  AND event_type = 'error'
                  AND timestamp >= now() - INTERVAL ${lookback} ${window}
                GROUP BY time_bucket
                ORDER BY time_bucket DESC
            `

            const result = await this.clickhouseClient.query({ query })
            const data = await result.json()

            if (data.data.length < 3) {
                return {
                    is_spike: false,
                    message: 'Insufficient data for spike detection',
                }
            }

            const counts = data.data.map((row: any) => parseInt(row.error_count))
            const currentCount = counts[0]
            const historicalCounts = counts.slice(1)

            const avg = historicalCounts.reduce((sum, c) => sum + c, 0) / historicalCounts.length
            const variance = historicalCounts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / historicalCounts.length
            const std = Math.sqrt(variance)

            const threshold = avg + 2 * std
            const isSpike = currentCount > threshold && currentCount > avg * 1.5

            const result_data = {
                app_id: appId,
                time_window: window,
                current_count: currentCount,
                baseline_avg: parseFloat(avg.toFixed(2)),
                baseline_std: parseFloat(std.toFixed(2)),
                threshold: parseFloat(threshold.toFixed(2)),
                is_spike: isSpike,
                spike_multiplier: avg > 0 ? parseFloat((currentCount / avg).toFixed(2)) : 0,
                detection_time: new Date().toISOString(),
            }

            if (isSpike) {
                try {
                    if (this.redis.status === 'ready') {
                        const alertKey = `error_spike:${appId}:${Date.now()}`
                        await this.redis.setex(alertKey, 3600, JSON.stringify(result_data))
                        await this.redis.lpush(`error_spikes:${appId}`, alertKey)
                        await this.redis.ltrim(`error_spikes:${appId}`, 0, 99)
                        this.logger.log(`Error spike detected for ${appId}: ${currentCount} (${result_data.spike_multiplier}x baseline)`)
                    }
                } catch (error: any) {
                    this.logger.warn(`Failed to record spike alert: ${error.message}`)
                }
            }

            return result_data
        } catch (error: any) {
            this.logger.error(`Failed to detect error spikes: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取最近的错误突增告警
     *
     * @description
     * 查询 Redis 中存储的最近错误突增记录。
     */
    async getRecentSpikes(appId: string, limit = 10) {
        try {
            if (this.redis.status !== 'ready') {
                return { spikes: [], message: 'Redis not available' }
            }

            const spikeKeys = await this.redis.lrange(`error_spikes:${appId}`, 0, limit - 1)
            const spikes = []

            for (const key of spikeKeys) {
                const data = await this.redis.get(key)
                if (data) {
                    spikes.push(JSON.parse(data))
                }
            }

            return { spikes, total: spikes.length }
        } catch (error: any) {
            this.logger.error(`Failed to get recent spikes: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取时间窗口对应的 ClickHouse 时间函数
     */
    getTimeWindowFunction(window: 'hour' | 'day' | 'week'): string {
        switch (window) {
            case 'hour':
                return 'toStartOfHour'
            case 'day':
                return 'toStartOfDay'
            case 'week':
                return 'toMonday'
            default:
                return 'toStartOfHour'
        }
    }
}
