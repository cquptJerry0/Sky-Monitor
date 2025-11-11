import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'

import { RedisService } from '../../../fundamentals/redis'

import { ErrorSimilarityService } from './error-similarity.service'

/**
 * 错误聚合服务
 *
 * @description
 * 负责智能错误聚合、结果持久化和历史查询。
 * 使用二级聚合算法（指纹 + 相似度）减少重复告警。
 */
@Injectable()
export class ErrorAggregationService {
    private readonly logger = new Logger(ErrorAggregationService.name)
    private readonly redis: Redis

    constructor(
        @Inject('CLICKHOUSE_CLIENT') private clickhouseClient: ClickHouseClient,
        private readonly errorSimilarityService: ErrorSimilarityService,
        private readonly redisService: RedisService
    ) {
        this.redis = this.redisService.getClient()
    }

    /**
     * 获取基础错误分组（按 fingerprint）
     */
    async getErrorGroups(params: { appId: string; limit?: number }) {
        try {
            const { appId, limit = 100 } = params

            const query = `
                SELECT 
                    error_fingerprint,
                    any(error_message) as error_message,
                    any(error_stack) as error_stack,
                    SUM(dedup_count) as total_count,
                    MIN(timestamp) as first_seen,
                    MAX(timestamp) as last_seen,
                    uniq(user_id) as affected_users,
                    uniq(session_id) as affected_sessions,
                    any(framework) as framework,
                    any(device_browser) as browser,
                    any(device_os) as os
                FROM monitor_events
                WHERE app_id = '${appId}' 
                  AND event_type = 'error' 
                  AND error_fingerprint != ''
                GROUP BY error_fingerprint
                ORDER BY total_count DESC
                LIMIT ${limit}
            `

            const result = await this.clickhouseClient.query({ query })
            const data = await result.json()

            return {
                data: data.data,
                total: data.data.length,
            }
        } catch (error: any) {
            this.logger.error(`Failed to get error groups: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 智能错误聚合
     *
     * @description
     * 基于错误指纹和消息相似度的二级聚合：
     *
     * 第一级聚合（基于指纹）：
     * - 使用 FNV-1a 哈希算法生成的错误指纹
     * - 相同指纹的错误直接归为一组
     *
     * 第二级聚合（基于相似度）：
     * - 对不同指纹的错误组进行相似度计算
     * - 使用 Levenshtein 距离算法
     * - 相似度超过阈值的错误组合并
     *
     * 优势：
     * - 减少重复告警
     * - 识别相似错误模式
     * - 提升错误管理效率
     *
     * 缓存策略：
     * - Redis 缓存，TTL: 5 分钟
     * - 缓存 Key: smart_error_groups:{appId}:{threshold}:{limit}
     * - 缓存降级：Redis 不可用时直接计算
     */
    async getSmartErrorGroups(params: { appId: string; threshold?: number; limit?: number }) {
        try {
            const { appId, threshold = 0.8, limit = 100 } = params

            // 尝试从 Redis 缓存读取
            const cacheKey = `smart_error_groups:${appId}:${threshold}:${limit}`
            try {
                if (this.redis.status === 'ready') {
                    const cached = await this.redis.get(cacheKey)
                    if (cached) {
                        this.logger.log(`Cache hit for smart error groups: ${appId}`)
                        return JSON.parse(cached)
                    }
                }
            } catch (error: any) {
                this.logger.warn(`Failed to read from cache: ${error.message}`)
            }

            // 第一步：按 fingerprint 分组（基础聚合）
            const basicGroupsResult = await this.getErrorGroups({ appId, limit: 500 })
            const basicGroups = basicGroupsResult.data as any[]

            if (basicGroups.length === 0) {
                return {
                    data: [],
                    total: 0,
                    originalGroups: 0,
                    mergedGroups: 0,
                }
            }

            // 第二步：提取错误消息并预处理
            const messages = basicGroups.map(g => g.error_message || '')
            const fingerprints = basicGroups.map(g => g.error_fingerprint)

            // 性能优化：预归一化所有消息（避免重复计算）
            const normalizedMessages = messages.map(msg => this.errorSimilarityService['normalize'](msg))

            // 第三步：计算相似度并构建聚合映射（优化版）
            const groupMap: number[] = Array.from({ length: basicGroups.length }, (_, i) => i)
            let comparisonCount = 0

            // 性能优化：只对前 300 个高频错误组进行详细相似度计算
            const maxCompareGroups = Math.min(basicGroups.length, 300)

            for (let i = 0; i < maxCompareGroups; i++) {
                if (groupMap[i] !== i) continue

                const normalizedI = normalizedMessages[i]
                const lenI = normalizedI.length

                for (let j = i + 1; j < maxCompareGroups; j++) {
                    if (groupMap[j] !== j) continue

                    const normalizedJ = normalizedMessages[j]
                    const lenJ = normalizedJ.length

                    // 性能优化1：长度差异过大时直接跳过
                    const maxLen = Math.max(lenI, lenJ)
                    const minLen = Math.min(lenI, lenJ)
                    if (maxLen > 0 && (maxLen - minLen) / maxLen > 1 - threshold) {
                        continue
                    }

                    // 性能优化2：完全相同的归一化消息直接合并
                    if (normalizedI === normalizedJ) {
                        groupMap[j] = i
                        comparisonCount++
                        continue
                    }

                    // 计算相似度
                    const similarity = this.errorSimilarityService.calculateSimilarity(messages[i], messages[j])
                    comparisonCount++

                    if (similarity >= threshold) {
                        groupMap[j] = i
                    }
                }
            }

            this.logger.log(
                `Similarity comparisons: ${comparisonCount} (optimized from ${(basicGroups.length * (basicGroups.length - 1)) / 2})`
            )

            // 第四步：聚合统计数据
            const mergedGroups: Map<number, any> = new Map()

            for (let i = 0; i < basicGroups.length; i++) {
                const targetIndex = groupMap[i]
                const currentGroup = basicGroups[i]

                if (!mergedGroups.has(targetIndex)) {
                    mergedGroups.set(targetIndex, {
                        error_fingerprint: fingerprints[targetIndex],
                        error_message: messages[targetIndex],
                        error_stack: currentGroup.error_stack,
                        total_count: 0,
                        first_seen: currentGroup.first_seen,
                        last_seen: currentGroup.last_seen,
                        affected_users: new Set(),
                        affected_sessions: new Set(),
                        framework: currentGroup.framework,
                        browser: currentGroup.browser,
                        os: currentGroup.os,
                        sub_groups: [],
                    })
                }

                const mergedGroup = mergedGroups.get(targetIndex)
                mergedGroup.total_count += parseInt(currentGroup.total_count || 0)

                if (currentGroup.first_seen < mergedGroup.first_seen) {
                    mergedGroup.first_seen = currentGroup.first_seen
                }
                if (currentGroup.last_seen > mergedGroup.last_seen) {
                    mergedGroup.last_seen = currentGroup.last_seen
                }

                if (targetIndex !== i) {
                    mergedGroup.sub_groups.push({
                        fingerprint: fingerprints[i],
                        message: messages[i],
                        count: parseInt(currentGroup.total_count || 0),
                    })
                }
            }

            // 第五步：转换为数组并排序
            const result = Array.from(mergedGroups.values())
                .map(g => ({
                    ...g,
                    affected_users: g.affected_users.size || 0,
                    affected_sessions: g.affected_sessions.size || 0,
                    is_merged: g.sub_groups.length > 0,
                    merged_count: g.sub_groups.length + 1,
                }))
                .sort((a, b) => b.total_count - a.total_count)
                .slice(0, limit)

            this.logger.log(`Smart error grouping completed: ${basicGroups.length} -> ${result.length} groups`)

            const finalResult = {
                data: result,
                total: result.length,
                originalGroups: basicGroups.length,
                mergedGroups: result.length,
                reductionRate: ((1 - result.length / basicGroups.length) * 100).toFixed(2) + '%',
            }

            // 将结果写入 Redis 缓存（TTL: 5 分钟）
            try {
                if (this.redis.status === 'ready') {
                    await this.redis.setex(cacheKey, 300, JSON.stringify(finalResult))
                    this.logger.log(`Cached smart error groups for ${appId} (TTL: 5 min)`)
                }
            } catch (error: any) {
                this.logger.warn(`Failed to write to cache: ${error.message}`)
            }

            // 异步持久化聚合结果
            this.persistAggregationResult(appId, threshold, finalResult).catch(error => {
                this.logger.error(`Failed to persist aggregation result: ${error.message}`)
            })

            return finalResult
        } catch (error: any) {
            this.logger.error(`Failed to get smart error groups: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 持久化聚合结果到 ClickHouse
     */
    private async persistAggregationResult(appId: string, threshold: number, result: any) {
        const aggregationRecord = {
            app_id: appId,
            timestamp: new Date().toISOString(),
            threshold: threshold,
            original_groups: result.originalGroups,
            merged_groups: result.mergedGroups,
            reduction_rate: parseFloat(result.reductionRate),
            aggregation_data: JSON.stringify(result.data.slice(0, 50)),
        }

        await this.clickhouseClient.insert({
            table: 'error_aggregation_history',
            values: [aggregationRecord],
            format: 'JSONEachRow',
        })

        this.logger.log(`Persisted aggregation result for ${appId}, reduced from ${result.originalGroups} to ${result.mergedGroups}`)
    }

    /**
     * 查询历史聚合结果
     */
    async getAggregationHistory(params: { appId: string; startTime?: string; endTime?: string; limit?: number }) {
        try {
            const { appId, startTime, endTime, limit = 100 } = params

            const whereConditions = [`app_id = '${appId}'`]
            if (startTime) {
                whereConditions.push(`timestamp >= '${startTime}'`)
            }
            if (endTime) {
                whereConditions.push(`timestamp <= '${endTime}'`)
            }

            const whereClause = whereConditions.join(' AND ')

            const query = `
                SELECT 
                    timestamp,
                    threshold,
                    original_groups,
                    merged_groups,
                    reduction_rate,
                    aggregation_data
                FROM error_aggregation_history
                WHERE ${whereClause}
                ORDER BY timestamp DESC
                LIMIT ${limit}
            `

            const result = await this.clickhouseClient.query({ query })
            const data = await result.json()

            return {
                data: (data.data as any[]).map((record: any) => ({
                    ...record,
                    aggregation_data: record.aggregation_data ? JSON.parse(record.aggregation_data) : null,
                })),
                total: data.data.length,
            }
        } catch (error: any) {
            this.logger.error(`Failed to get aggregation history: ${error.message}`, error.stack)
            throw error
        }
    }
}
