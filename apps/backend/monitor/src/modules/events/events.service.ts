import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import Redis from 'ioredis'

import { ErrorSimilarityService } from './error-similarity.service'

@Injectable()
export class EventsService implements OnModuleInit {
    private readonly logger = new Logger(EventsService.name)
    private readonly redis: Redis

    constructor(
        @Inject('CLICKHOUSE_CLIENT') private clickhouseClient: ClickHouseClient,
        private readonly errorSimilarityService: ErrorSimilarityService
    ) {
        this.redis = new Redis({
            host: 'localhost',
            port: 6379,
            password: 'skyRedis2024',
        })
    }

    async onModuleInit() {
        try {
            await this.redis.connect()
            this.logger.log('Redis connected for events caching')
        } catch (error) {
            this.logger.warn('Redis connection failed, caching will be disabled')
        }
    }

    /**
     * 获取事件列表
     */
    async getEvents(params: { appId?: string; eventType?: string; limit?: number; offset?: number; startTime?: string; endTime?: string }) {
        try {
            const { appId, eventType, limit = 50, offset = 0, startTime, endTime } = params

            const whereConditions = []
            if (appId) {
                whereConditions.push(`app_id = '${appId}'`)
            }
            if (eventType) {
                whereConditions.push(`event_type = '${eventType}'`)
            }
            if (startTime) {
                whereConditions.push(`timestamp >= '${startTime}'`)
            }
            if (endTime) {
                whereConditions.push(`timestamp <= '${endTime}'`)
            }

            const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''

            const query = `
                SELECT 
                    id,
                    app_id,
                    event_type,
                    event_name,
                    event_data,
                    path,
                    user_agent,
                    timestamp,
                    created_at,
                    
                    -- 错误字段
                    error_message,
                    error_stack,
                    error_lineno,
                    error_colno,
                    error_fingerprint,
                    
                    -- 设备信息
                    device_browser,
                    device_browser_version,
                    device_os,
                    device_os_version,
                    device_type,
                    device_screen,
                    
                    -- 网络信息
                    network_type,
                    network_rtt,
                    
                    -- 框架信息
                    framework,
                    component_name,
                    component_stack,
                    
                    -- HTTP 错误
                    http_url,
                    http_method,
                    http_status,
                    http_duration,
                    
                    -- 资源错误
                    resource_url,
                    resource_type,
                    
                    -- Session 会话
                    session_id,
                    session_start_time,
                    session_duration,
                    session_event_count,
                    session_error_count,
                    session_page_views,
                    
                    -- User 用户
                    user_id,
                    user_email,
                    user_username,
                    user_ip,
                    
                    -- Scope 上下文
                    tags,
                    extra,
                    breadcrumbs,
                    contexts,
                    
                    -- Event Level
                    event_level,
                    environment,
                    
                    -- Performance
                    perf_category,
                    perf_value,
                    perf_is_slow,
                    perf_success,
                    perf_metrics,
                    
                    -- 元数据
                    dedup_count,
                    sampling_rate,
                    sampling_sampled
                FROM monitor_events
                ${whereClause}
                ORDER BY timestamp DESC
                LIMIT ${limit}
                OFFSET ${offset}
            `

            const result = await this.clickhouseClient.query({ query })
            const data = await result.json()

            // 获取总数
            const countQuery = `
                SELECT count() as total
                FROM monitor_events
                ${whereClause}
            `
            const countResult = await this.clickhouseClient.query({ query: countQuery })
            const countData = (await countResult.json()) as { data: Array<{ total: number }> }

            return {
                data: data.data,
                total: countData.data[0]?.total || 0,
                limit,
                offset,
            }
        } catch (error) {
            this.logger.error(`Failed to get events: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取事件详情
     *
     * @description
     * 查询单个事件的完整信息，并提取 SourceMap 解析结果。
     *
     * SourceMap 状态说明：
     * - 'parsed': 已成功解析，parsedStack 可用
     * - 'parsing': 正在异步解析中（队列处理中）
     * - 'not_available': 无需解析（非错误事件或无堆栈）
     * - 'failed': 解析失败（找不到 SourceMap 或解析错误）
     *
     * @param id - 事件 ID
     * @returns 事件详情，包含 parsedStack 和 sourceMapStatus
     */
    async getEventById(id: string) {
        try {
            const query = `
                SELECT *
                FROM monitor_events
                WHERE id = '${id}'
                LIMIT 1
            `

            const result = await this.clickhouseClient.query({ query })
            const data = await result.json()

            if (!data.data || data.data.length === 0) {
                return null
            }

            const event = data.data[0] as any

            // 解析 event_data JSON 字段，提取 SourceMap 相关信息
            let parsedStack = null
            let originalStack = null
            let sourceMapStatus: 'parsed' | 'parsing' | 'not_available' | 'failed' = 'not_available'

            if (event.event_data) {
                try {
                    const eventData = JSON.parse(event.event_data)
                    parsedStack = eventData.parsedStack || null
                    originalStack = eventData.originalStack || null

                    // 判断 SourceMap 状态
                    if (parsedStack) {
                        sourceMapStatus = 'parsed'
                    } else if (event.error_stack && event.release && this.isErrorEvent(event.event_type)) {
                        // 有堆栈、有 release、是错误事件 → 应该被解析但还没完成
                        sourceMapStatus = 'parsing'
                    }
                } catch (error: any) {
                    this.logger.error(`Failed to parse event_data JSON for event ${id}: ${error.message}`)
                }
            }

            // 返回增强后的事件数据
            return {
                ...event,
                parsedStack,
                originalStack,
                sourceMapStatus,
            }
        } catch (error) {
            this.logger.error(`Failed to get event by id: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 判断是否为错误类型事件
     */
    private isErrorEvent(eventType: string): boolean {
        return ['error', 'exception', 'unhandledrejection'].includes(eventType)
    }

    /**
     * 批量查询事件的 SourceMap 解析状态
     *
     * @description
     * 用于前端轮询解析进度，特别是在错误列表页需要显示解析状态时。
     *
     * 应用场景：
     * - 错误列表页批量显示解析状态
     * - 前端轮询检查解析是否完成
     * - 监控解析成功率
     *
     * @example
     * ```typescript
     * const statuses = await service.getSourceMapStatuses({
     *   eventIds: ['event-1', 'event-2', 'event-3']
     * })
     * // 返回：
     * // {
     * //   'event-1': { status: 'parsed', hasParsedStack: true },
     * //   'event-2': { status: 'parsing', hasParsedStack: false },
     * //   'event-3': { status: 'not_available', hasParsedStack: false }
     * // }
     * ```
     *
     * @param params.eventIds - 事件 ID 数组（最多 100 个）
     * @returns 事件 ID 到解析状态的映射
     */
    async getSourceMapStatuses(params: { eventIds: string[] }) {
        try {
            const { eventIds } = params

            if (eventIds.length === 0) {
                return {}
            }

            // 限制批量查询数量
            const limitedIds = eventIds.slice(0, 100)

            const query = `
                SELECT 
                    id,
                    event_type,
                    error_stack,
                    release,
                    event_data
                FROM monitor_events
                WHERE id IN (${limitedIds.map(id => `'${id}'`).join(',')})
            `

            const result = await this.clickhouseClient.query({ query })
            const data = await result.json()

            // 构建状态映射
            const statusMap: Record<string, { status: string; hasParsedStack: boolean }> = {}

            for (const event of data.data as any[]) {
                let status: 'parsed' | 'parsing' | 'not_available' | 'failed' = 'not_available'
                let hasParsedStack = false

                if (event.event_data) {
                    try {
                        const eventData = JSON.parse(event.event_data)
                        if (eventData.parsedStack) {
                            status = 'parsed'
                            hasParsedStack = true
                        } else if (event.error_stack && event.release && this.isErrorEvent(event.event_type)) {
                            status = 'parsing'
                        }
                    } catch (error: any) {
                        this.logger.error(`Failed to parse event_data for event ${event.id}`)
                    }
                }

                statusMap[event.id] = { status, hasParsedStack }
            }

            return statusMap
        } catch (error) {
            this.logger.error(`Failed to get SourceMap statuses: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取统计数据
     */
    async getStats(params: { appId?: string; startTime?: string; endTime?: string }) {
        try {
            const { appId, startTime, endTime } = params

            const whereConditions = []
            if (appId) {
                whereConditions.push(`app_id = '${appId}'`)
            }
            if (startTime) {
                whereConditions.push(`timestamp >= '${startTime}'`)
            }
            if (endTime) {
                whereConditions.push(`timestamp <= '${endTime}'`)
            }

            const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''

            // 按事件类型统计
            const eventTypeQuery = `
                SELECT 
                    event_type,
                    count() as count
                FROM monitor_events
                ${whereClause}
                GROUP BY event_type
                ORDER BY count DESC
            `

            // 错误趋势（按小时统计）
            const errorTrendQuery = `
                SELECT 
                    toStartOfHour(timestamp) as hour,
                    count() as count
                FROM monitor_events
                ${whereClause ? whereClause + ' AND' : 'WHERE'} event_type IN ('error', 'unhandledrejection')
                GROUP BY hour
                ORDER BY hour DESC
                LIMIT 24
            `

            // Web Vitals统计
            const webVitalsQuery = `
                SELECT 
                    event_name,
                    avg(JSONExtractFloat(event_data, 'value')) as avg_value,
                    quantile(0.75)(JSONExtractFloat(event_data, 'value')) as p75_value,
                    quantile(0.95)(JSONExtractFloat(event_data, 'value')) as p95_value
                FROM monitor_events
                ${whereClause ? whereClause + ' AND' : 'WHERE'} event_type = 'webVital'
                GROUP BY event_name
            `

            const [eventTypeResult, errorTrendResult, webVitalsResult] = await Promise.all([
                this.clickhouseClient.query({ query: eventTypeQuery }),
                this.clickhouseClient.query({ query: errorTrendQuery }),
                this.clickhouseClient.query({ query: webVitalsQuery }),
            ])

            const eventTypeData = await eventTypeResult.json()
            const errorTrendData = await errorTrendResult.json()
            const webVitalsData = await webVitalsResult.json()

            return {
                eventTypeCounts: eventTypeData.data,
                errorTrend: errorTrendData.data,
                webVitals: webVitalsData.data,
            }
        } catch (error) {
            this.logger.error(`Failed to get stats: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取应用的事件摘要
     */
    async getAppSummary(appId: string) {
        try {
            const query = `
                SELECT 
                    count() as total_events,
                    countIf(event_type IN ('error', 'unhandledrejection')) as error_count,
                    countIf(event_type = 'webVital') as performance_count,
                    min(timestamp) as first_seen,
                    max(timestamp) as last_seen,
                    
                    -- Session 统计
                    uniq(session_id) as session_count,
                    
                    -- User 统计
                    uniq(user_id) as user_count,
                    
                    -- 慢请求统计
                    countIf(perf_is_slow = 1) as slow_request_count,
                    
                    -- 去重后错误数
                    sum(dedup_count) as total_error_occurrences
                FROM monitor_events
                WHERE app_id = '${appId}'
            `

            const result = await this.clickhouseClient.query({ query })
            const data = await result.json()

            return data.data[0] || null
        } catch (error) {
            this.logger.error(`Failed to get app summary: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 按会话ID查询事件
     */
    async getEventsBySession(sessionId: string) {
        try {
            const query = `
                SELECT *
                FROM monitor_events
                WHERE session_id = '${sessionId}'
                ORDER BY timestamp ASC
            `

            const result = await this.clickhouseClient.query({ query })
            const data = await result.json()

            return {
                data: data.data,
                total: data.data.length,
            }
        } catch (error) {
            this.logger.error(`Failed to get events by session: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取会话列表
     */
    async getSessions(params: { appId: string; limit?: number; offset?: number }) {
        try {
            const { appId, limit = 50, offset = 0 } = params

            const query = `
                SELECT 
                    session_id,
                    MIN(session_start_time) as start_time,
                    MAX(session_duration) as duration,
                    MAX(session_event_count) as event_count,
                    MAX(session_error_count) as error_count,
                    MAX(session_page_views) as page_views,
                    any(user_id) as user_id,
                    any(user_email) as user_email,
                    any(user_username) as user_username,
                    MAX(timestamp) as last_event_time,
                    MIN(timestamp) as first_event_time
                FROM monitor_events
                WHERE app_id = '${appId}' AND session_id != ''
                GROUP BY session_id
                ORDER BY start_time DESC
                LIMIT ${limit}
                OFFSET ${offset}
            `

            const result = await this.clickhouseClient.query({ query })
            const data = await result.json()

            // 获取总数
            const countQuery = `
                SELECT uniq(session_id) as total
                FROM monitor_events
                WHERE app_id = '${appId}' AND session_id != ''
            `
            const countResult = await this.clickhouseClient.query({ query: countQuery })
            const countData = (await countResult.json()) as { data: Array<{ total: number }> }

            return {
                data: data.data,
                total: countData.data[0]?.total || 0,
                limit,
                offset,
            }
        } catch (error) {
            this.logger.error(`Failed to get sessions: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取慢请求列表
     */
    async getSlowRequests(params: { appId: string; threshold?: number; limit?: number }) {
        try {
            const { appId, threshold = 3000, limit = 100 } = params

            const query = `
                SELECT 
                    http_url,
                    http_method,
                    AVG(http_duration) as avg_duration,
                    quantile(0.95)(http_duration) as p95_duration,
                    MAX(http_duration) as max_duration,
                    COUNT(*) as count,
                    countIf(perf_success = 0) as error_count,
                    (error_count / count) * 100 as error_rate
                FROM monitor_events
                WHERE app_id = '${appId}' 
                  AND perf_category = 'http'
                  AND http_duration > ${threshold}
                GROUP BY http_url, http_method
                ORDER BY avg_duration DESC
                LIMIT ${limit}
            `

            const result = await this.clickhouseClient.query({ query })
            const data = await result.json()

            return {
                data: data.data,
                threshold,
            }
        } catch (error) {
            this.logger.error(`Failed to get slow requests: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取错误聚合（按指纹分组）
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
        } catch (error) {
            this.logger.error(`Failed to get error groups: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 按用户查询事件
     */
    async getUserEvents(params: { userId: string; appId: string; limit?: number }) {
        try {
            const { userId, appId, limit = 100 } = params

            const query = `
                SELECT *
                FROM monitor_events
                WHERE app_id = '${appId}' AND user_id = '${userId}'
                ORDER BY timestamp DESC
                LIMIT ${limit}
            `

            const result = await this.clickhouseClient.query({ query })
            const data = await result.json()

            return {
                data: data.data,
                total: data.data.length,
            }
        } catch (error) {
            this.logger.error(`Failed to get user events: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取采样率统计
     */
    async getSamplingStats(appId: string) {
        try {
            const query = `
                SELECT 
                    event_type,
                    AVG(sampling_rate) as avg_rate,
                    COUNT(*) as sampled_count,
                    SUM(1 / sampling_rate) as estimated_total
                FROM monitor_events
                WHERE app_id = '${appId}' AND sampling_sampled = 1
                GROUP BY event_type
            `

            const result = await this.clickhouseClient.query({ query })
            const data = await result.json()

            return {
                data: data.data,
            }
        } catch (error) {
            this.logger.error(`Failed to get sampling stats: ${error.message}`, error.stack)
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
     *
     * @example
     * ```typescript
     * // 原始分组（5个组）
     * Group 1: "Cannot read property 'name' of undefined"
     * Group 2: "Cannot read property 'age' of undefined"
     * Group 3: "Cannot read property 'email' of undefined"
     * Group 4: "Network error"
     * Group 5: "Timeout error"
     *
     * // 智能聚合后（3个组）
     * Group A: "Cannot read property 'X' of undefined" (合并 1,2,3)
     * Group B: "Network error"
     * Group C: "Timeout error"
     * ```
     *
     * @param params.appId - 应用 ID
     * @param params.threshold - 相似度阈值（0-1），默认 0.8
     * @param params.limit - 最大返回组数，默认 100
     * @returns 聚合后的错误组
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
            } catch (error) {
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
            // groupMap[i] = j 表示第 i 个组应归入第 j 个组
            const groupMap: number[] = Array.from({ length: basicGroups.length }, (_, i) => i)
            let comparisonCount = 0

            // 性能优化：只对前 300 个高频错误组进行详细相似度计算
            // 后续低频错误组保持独立，避免 O(n²) 爆炸
            const maxCompareGroups = Math.min(basicGroups.length, 300)

            for (let i = 0; i < maxCompareGroups; i++) {
                // 跳过已被合并的组
                if (groupMap[i] !== i) continue

                const normalizedI = normalizedMessages[i]
                const lenI = normalizedI.length

                for (let j = i + 1; j < maxCompareGroups; j++) {
                    // 跳过已被合并的组
                    if (groupMap[j] !== j) continue

                    const normalizedJ = normalizedMessages[j]
                    const lenJ = normalizedJ.length

                    // 性能优化1：长度差异过大时直接跳过（相似度必然低于阈值）
                    // 如果 |len1 - len2| / max(len1, len2) > (1 - threshold)，则相似度必然 < threshold
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

                    // 计算相似度（使用预归一化的消息）
                    const similarity = this.errorSimilarityService.calculateSimilarity(messages[i], messages[j])
                    comparisonCount++

                    // 如果相似度超过阈值，合并到第 i 组
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
                    // 创建新的聚合组
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
                        sub_groups: [], // 子组信息
                    })
                }

                const mergedGroup = mergedGroups.get(targetIndex)

                // 累加统计数据
                mergedGroup.total_count += parseInt(currentGroup.total_count || 0)

                // 更新时间范围
                if (currentGroup.first_seen < mergedGroup.first_seen) {
                    mergedGroup.first_seen = currentGroup.first_seen
                }
                if (currentGroup.last_seen > mergedGroup.last_seen) {
                    mergedGroup.last_seen = currentGroup.last_seen
                }

                // 记录子组信息（用于展示合并详情）
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
                    merged_count: g.sub_groups.length + 1, // 包含主组
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
            } catch (error) {
                this.logger.warn(`Failed to write to cache: ${error.message}`)
            }

            // 异步持久化聚合结果到 ClickHouse（不阻塞返回）
            this.persistAggregationResult(appId, threshold, finalResult).catch(error => {
                this.logger.error(`Failed to persist aggregation result: ${error.message}`)
            })

            return finalResult
        } catch (error) {
            this.logger.error(`Failed to get smart error groups: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 持久化聚合结果到 ClickHouse
     *
     * @description
     * 将智能错误聚合的结果存储到 ClickHouse，用于：
     * - 历史聚合结果查询
     * - 聚合效果对比分析
     * - 错误分组趋势分析
     *
     * 数据模型：
     * - app_id: 应用 ID
     * - timestamp: 聚合时间
     * - threshold: 相似度阈值
     * - original_groups: 原始分组数
     * - merged_groups: 聚合后分组数
     * - reduction_rate: 减少率
     * - aggregation_data: 聚合详情（JSON）
     *
     * @param appId - 应用 ID
     * @param threshold - 相似度阈值
     * @param result - 聚合结果
     */
    private async persistAggregationResult(appId: string, threshold: number, result: any) {
        const aggregationRecord = {
            app_id: appId,
            timestamp: new Date().toISOString(),
            threshold: threshold,
            original_groups: result.originalGroups,
            merged_groups: result.mergedGroups,
            reduction_rate: parseFloat(result.reductionRate),
            aggregation_data: JSON.stringify(result.data.slice(0, 50)), // 只保存前 50 组详情
        }

        // 注意：需要先创建表 error_aggregation_history
        // 如果表不存在，此操作会失败（日志记录但不抛出错误）
        await this.clickhouseClient.insert({
            table: 'error_aggregation_history',
            values: [aggregationRecord],
            format: 'JSONEachRow',
        })

        this.logger.log(`Persisted aggregation result for ${appId}, reduced from ${result.originalGroups} to ${result.mergedGroups}`)
    }

    /**
     * 查询历史聚合结果
     *
     * @description
     * 用于分析聚合效果随时间的变化趋势。
     *
     * 应用场景：
     * - 对比不同时间点的聚合效果
     * - 评估聚合算法的稳定性
     * - 分析错误模式的演变
     *
     * @example
     * ```typescript
     * const history = await service.getAggregationHistory({
     *   appId: 'my-app',
     *   startTime: '2024-01-01 00:00:00',
     *   limit: 100
     * })
     * ```
     *
     * @param params.appId - 应用 ID
     * @param params.startTime - 开始时间（可选）
     * @param params.endTime - 结束时间（可选）
     * @param params.limit - 最大返回记录数
     * @returns 历史聚合记录
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
        } catch (error) {
            this.logger.error(`Failed to get aggregation history: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 检测错误突增（异常峰值检测）
     *
     * @description
     * 通过统计分析检测错误数量的异常突增。
     *
     * 检测算法：
     * 1. 计算最近 N 个时间窗口的平均错误数和标准差
     * 2. 如果当前窗口的错误数 > 平均值 + 2*标准差，则认为突增
     * 3. 突增倍数 = 当前值 / 平均值
     *
     * 应用场景：
     * - 实时监控错误突增
     * - 版本发布后的异常检测
     * - 故障预警
     *
     * @example
     * ```typescript
     * const spikes = await service.detectErrorSpikes({
     *   appId: 'my-app',
     *   window: 'hour',
     *   lookback: 24
     * })
     * // 返回：
     * // {
     * //   current_count: 500,
     * //   baseline_avg: 50,
     * //   baseline_std: 10,
     * //   is_spike: true,
     * //   spike_multiplier: 10.0,
     * //   threshold: 70  // avg + 2*std
     * // }
     * ```
     *
     * @param params.appId - 应用 ID
     * @param params.window - 时间窗口：'hour' | 'day'
     * @param params.lookback - 回看时间窗口数量（默认 24）
     * @returns 突增检测结果
     */
    async detectErrorSpikes(params: { appId: string; window?: 'hour' | 'day'; lookback?: number }) {
        try {
            const { appId, window = 'hour', lookback = 24 } = params

            const timeFunction = this.getTimeWindowFunction(window)

            // 查询最近 N 个时间窗口的错误数
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

            // 计算统计指标
            const avg = historicalCounts.reduce((sum, c) => sum + c, 0) / historicalCounts.length
            const variance = historicalCounts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / historicalCounts.length
            const std = Math.sqrt(variance)

            // 突增判断：当前值 > 平均值 + 2*标准差
            const threshold = avg + 2 * std
            const isSpike = currentCount > threshold && currentCount > avg * 1.5 // 至少是平均值的 1.5 倍

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

            // 如果检测到突增，记录到 Redis（供前端轮询查询）
            if (isSpike) {
                try {
                    if (this.redis.status === 'ready') {
                        const alertKey = `error_spike:${appId}:${Date.now()}`
                        await this.redis.setex(alertKey, 3600, JSON.stringify(result_data)) // TTL: 1小时
                        await this.redis.lpush(`error_spikes:${appId}`, alertKey)
                        await this.redis.ltrim(`error_spikes:${appId}`, 0, 99) // 保留最近 100 个
                        this.logger.log(`Error spike detected for ${appId}: ${currentCount} (${result_data.spike_multiplier}x baseline)`)
                    }
                } catch (error) {
                    this.logger.warn(`Failed to record spike alert: ${error.message}`)
                }
            }

            return result_data
        } catch (error) {
            this.logger.error(`Failed to detect error spikes: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取最近的错误突增告警
     *
     * @description
     * 查询 Redis 中存储的最近错误突增记录。
     *
     * 前端可以通过轮询此接口实现准实时告警。
     *
     * @param appId - 应用 ID
     * @param limit - 最大返回数量（默认 10）
     * @returns 突增告警列表
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
        } catch (error) {
            this.logger.error(`Failed to get recent spikes: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取错误趋势分析
     *
     * @description
     * 按时间窗口统计错误发生次数，生成趋势图数据。
     * 支持多种时间粒度：小时、天、周。
     *
     * 应用场景：
     * - 识别错误突增时间段
     * - 分析版本发布后的错误趋势
     * - 评估错误修复效果
     * - 监控系统稳定性
     *
     * @example
     * ```typescript
     * // 获取最近24小时的错误趋势
     * const trends = await service.getErrorTrends({
     *   appId: 'my-app',
     *   fingerprint: 'abc123',
     *   window: 'hour'
     * })
     *
     * // 返回数据结构：
     * {
     *   data: [
     *     { time_bucket: '2024-01-01 10:00:00', count: 5, total_occurrences: 15 },
     *     { time_bucket: '2024-01-01 11:00:00', count: 8, total_occurrences: 24 },
     *     ...
     *   ]
     * }
     * ```
     *
     * @param params.appId - 应用 ID
     * @param params.fingerprint - 错误指纹（可选），不提供则统计所有错误
     * @param params.window - 时间窗口粒度：'hour' | 'day' | 'week'
     * @param params.limit - 最大返回数据点数，默认 100
     * @returns 趋势数据
     */
    async getErrorTrends(params: { appId: string; fingerprint?: string; window: 'hour' | 'day' | 'week'; limit?: number }) {
        try {
            const { appId, fingerprint, window, limit = 100 } = params

            // 根据时间窗口选择 ClickHouse 时间函数
            const timeFunction = this.getTimeWindowFunction(window)

            // 构建查询条件
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

            // 反转数组，使时间从旧到新排列（便于绘制趋势图）
            const trendData = (data.data as any[]).reverse()

            // 计算统计信息
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
        } catch (error) {
            this.logger.error(`Failed to get error trends: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取多个错误的对比趋势
     *
     * @description
     * 在同一时间轴上对比多个错误指纹的趋势，用于：
     * - 比较不同错误的发生频率
     * - 分析错误之间的相关性
     * - 识别共同的触发时间段
     *
     * @param params.appId - 应用 ID
     * @param params.fingerprints - 错误指纹数组（最多10个）
     * @param params.window - 时间窗口粒度
     * @param params.limit - 每个指纹的最大数据点数
     * @returns 对比趋势数据
     */
    async compareErrorTrends(params: { appId: string; fingerprints: string[]; window: 'hour' | 'day' | 'week'; limit?: number }) {
        try {
            const { appId, fingerprints, window, limit = 100 } = params

            // 限制最多对比10个错误
            if (fingerprints.length > 10) {
                throw new Error('Maximum 10 fingerprints allowed for comparison')
            }

            // 获取每个指纹的趋势数据
            const trendsPromises = fingerprints.map(fingerprint => this.getErrorTrends({ appId, fingerprint, window, limit }))

            const trendsResults = await Promise.all(trendsPromises)

            // 合并时间轴，确保所有数据在同一时间轴上
            const allTimeBuckets = new Set<string>()
            trendsResults.forEach(result => {
                result.data.forEach((item: any) => {
                    allTimeBuckets.add(item.time_bucket)
                })
            })

            const sortedTimeBuckets = Array.from(allTimeBuckets).sort()

            // 构建对比数据
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
        } catch (error) {
            this.logger.error(`Failed to compare error trends: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取时间窗口对应的 ClickHouse 时间函数
     *
     * @description
     * ClickHouse 时间函数：
     * - toStartOfHour: 精确到小时开始时刻
     * - toStartOfDay: 精确到天开始时刻（00:00:00）
     * - toMonday: 精确到本周一（周的开始）
     *
     * @param window - 时间窗口粒度
     * @returns ClickHouse 时间函数名
     */
    private getTimeWindowFunction(window: 'hour' | 'day' | 'week'): string {
        switch (window) {
            case 'hour':
                return 'toStartOfHour'
            case 'day':
                return 'toStartOfDay'
            case 'week':
                return 'toMonday' // 周一作为一周的开始
            default:
                return 'toStartOfHour'
        }
    }
}
