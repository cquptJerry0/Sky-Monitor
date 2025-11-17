import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'

import { RedisService } from '../../fundamentals/redis'
import { mapEventsForFrontend, mapEventForFrontend } from './events.mapper'

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name)
    private readonly redis: Redis

    constructor(
        @Inject('CLICKHOUSE_CLIENT') private clickhouseClient: ClickHouseClient,
        private readonly redisService: RedisService
    ) {
        this.redis = this.redisService.getClient()
    }

    /**
     * 获取事件列表
     */
    async getEvents(params: { appId?: string; eventType?: string; limit?: number; offset?: number; timeRange?: string }) {
        try {
            const { appId, eventType, limit = 50, offset = 0, timeRange } = params

            const whereConditions = []
            const queryParams: Record<string, any> = { limit, offset }

            if (appId) {
                whereConditions.push(`app_id = {appId:String}`)
                queryParams.appId = appId
            }
            if (eventType) {
                // 错误类事件分组处理: error 包含 error, exception, unhandledrejection
                if (eventType === 'error') {
                    whereConditions.push(`event_type IN ('error', 'exception', 'unhandledrejection')`)
                } else {
                    whereConditions.push(`event_type = {eventType:String}`)
                    queryParams.eventType = eventType
                }
            }

            // 根据 timeRange 计算时间范围
            if (timeRange) {
                let intervalExpression: string
                switch (timeRange) {
                    case '15m':
                        intervalExpression = 'INTERVAL 15 MINUTE'
                        break
                    case '1h':
                        intervalExpression = 'INTERVAL 1 HOUR'
                        break
                    case '6h':
                        intervalExpression = 'INTERVAL 6 HOUR'
                        break
                    case '24h':
                        intervalExpression = 'INTERVAL 24 HOUR'
                        break
                    case '7d':
                        intervalExpression = 'INTERVAL 7 DAY'
                        break
                    case '30d':
                        intervalExpression = 'INTERVAL 30 DAY'
                        break
                    default:
                        intervalExpression = 'INTERVAL 1 HOUR'
                }
                whereConditions.push(`timestamp >= now() - ${intervalExpression}`)
            }

            const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''

            // 列表查询只返回必要字段
            const query = `
                SELECT
                    id,
                    app_id,
                    event_type,
                    event_name,
                    path,
                    timestamp,

                    -- 错误字段 (用于显示消息)
                    error_message,
                    error_lineno,
                    error_colno,

                    -- HTTP 错误 (用于显示消息)
                    http_url,
                    http_method,
                    http_status,
                    http_duration,

                    -- 资源错误 (用于显示消息)
                    resource_url,
                    resource_type,

                    -- Session 会话
                    session_id,
                    replay_id,

                    -- User 用户
                    user_id,
                    user_email,

                    -- Event Level
                    event_level,

                    -- Performance (用于显示消息)
                    perf_category,
                    perf_value,
                    perf_is_slow
                FROM monitor_events
                ${whereClause}
                ORDER BY timestamp DESC
                LIMIT {limit:UInt32}
                OFFSET {offset:UInt32}
            `

            const result = await this.clickhouseClient.query({
                query,
                query_params: queryParams,
            })
            const data = (await result.json()) as { data: any[] }

            // 获取总数
            const countQuery = `
                SELECT count() as total
                FROM monitor_events
                ${whereClause}
            `
            const countResult = await this.clickhouseClient.query({
                query: countQuery,
                query_params: queryParams,
            })
            const countData = (await countResult.json()) as { data: Array<{ total: number }> }

            // 映射数据库字段到前端期望的格式
            const mappedEvents = mapEventsForFrontend(data.data as any)

            return {
                data: mappedEvents,
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
        this.logger.log(`[DEBUG] getEventById called with id: ${id}`)

        try {
            const query = `
                SELECT *
                FROM monitor_events
                WHERE id = {id:String}
                LIMIT 1
            `

            const result = await this.clickhouseClient.query({
                query,
                query_params: { id },
            })
            const data = await result.json()

            this.logger.log(`[DEBUG] ClickHouse query result: ${data.data ? data.data.length : 0} rows`)

            if (!data.data || data.data.length === 0) {
                return null
            }

            const event = data.data[0] as any
            this.logger.log(`[DEBUG] Event found, event_data length: ${event.event_data ? event.event_data.length : 0}`)

            // 解析 event_data JSON 字段
            let parsedStack = null
            let originalStack = null
            let release = null
            let sessionId = event.session_id || null
            let replayId = null
            let environment = event.environment || null

            if (event.event_data) {
                this.logger.log(`[DEBUG] Processing event_data for event ${id}, length: ${event.event_data.length}`)

                try {
                    // 使用更宽松的 JSON 解析
                    const eventData = JSON.parse(event.event_data)
                    parsedStack = eventData.parsedStack || null
                    originalStack = eventData.originalStack || null
                    release = eventData.release || null
                    sessionId = eventData.sessionId || sessionId
                    replayId = eventData.replayId || null
                    environment = eventData.environment || environment

                    this.logger.log(`[DEBUG] JSON parse succeeded for event ${id}`)
                    this.logger.log(`[DEBUG] parsedStack: ${parsedStack ? 'found' : 'null'}`)
                    this.logger.log(`[DEBUG] originalStack: ${originalStack ? 'found' : 'null'}`)
                    this.logger.log(`[DEBUG] release: ${release || 'null'}`)
                    this.logger.log(`[DEBUG] sessionId: ${sessionId || 'null'}`)
                    this.logger.log(`[DEBUG] replayId: ${replayId || 'null'}`)
                    this.logger.log(`[DEBUG] environment: ${environment || 'null'}`)
                } catch (error: any) {
                    // 如果 JSON 解析失败，尝试使用正则提取关键字段
                    this.logger.warn(`Failed to parse event_data JSON for event ${id}, trying regex extraction: ${error.message}`)

                    try {
                        const parsedStackMatch = event.event_data.match(/"parsedStack":"([^"]+)"/)
                        if (parsedStackMatch) {
                            parsedStack = parsedStackMatch[1].replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
                            this.logger.log(`[DEBUG] Regex extracted parsedStack: ${parsedStack.substring(0, 50)}...`)
                        }

                        const originalStackMatch = event.event_data.match(/"originalStack":"([^"]*(?:\\.[^"]*)*)"/)
                        if (originalStackMatch) {
                            originalStack = originalStackMatch[1].replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
                            this.logger.log(`[DEBUG] Regex extracted originalStack: ${originalStack.substring(0, 50)}...`)
                        }

                        const releaseMatch = event.event_data.match(/"release":"([^"]+)"/)
                        if (releaseMatch) {
                            release = releaseMatch[1]
                            this.logger.log(`[DEBUG] Regex extracted release: ${release}`)
                        }

                        const sessionIdMatch = event.event_data.match(/"sessionId":"([^"]+)"/)
                        if (sessionIdMatch) {
                            sessionId = sessionIdMatch[1]
                            this.logger.log(`[DEBUG] Regex extracted sessionId: ${sessionId}`)
                        }

                        const replayIdMatch = event.event_data.match(/"replayId":"([^"]+)"/)
                        if (replayIdMatch) {
                            replayId = replayIdMatch[1]
                            this.logger.log(`[DEBUG] Regex extracted replayId: ${replayId}`)
                        }

                        const environmentMatch = event.event_data.match(/"environment":"([^"]+)"/)
                        if (environmentMatch) {
                            environment = environmentMatch[1]
                            this.logger.log(`[DEBUG] Regex extracted environment: ${environment}`)
                        }
                    } catch (regexError: any) {
                        this.logger.error(`Regex extraction also failed for event ${id}: ${regexError.message}`)
                    }
                }
            }

            // 判断 SourceMap 状态
            let sourceMapStatus: 'parsed' | 'parsing' | 'not_available' | 'failed' = 'not_available'
            if (parsedStack) {
                sourceMapStatus = 'parsed'
            } else if (event.error_stack && release && this.isErrorEvent(event.event_type)) {
                // 有堆栈、有 release、是错误事件 → 应该被解析但还没完成
                sourceMapStatus = 'parsing'
            }

            // 如果是错误事件且没有 replayId，尝试从 replay 事件中查找
            if (this.isErrorEvent(event.event_type) && !replayId && sessionId) {
                replayId = await this.findReplayIdBySession(sessionId, event.timestamp)
            }

            // 如果有 replayId，查询所有关联的错误事件
            let relatedErrors: Array<{ id: string; message: string; timestamp: string }> = []
            if (replayId) {
                const errors = await this.getErrorsByReplayId(replayId)
                // 只返回必要的字段，不包含 stack（减少数据量）
                relatedErrors = errors.map(error => ({
                    id: error.id,
                    message: error.message,
                    timestamp: error.timestamp,
                }))
                this.logger.log(`Found ${relatedErrors.length} related errors for replayId: ${replayId}`)
            }

            // 映射数据库字段到前端格式
            const mappedEvent = mapEventForFrontend(event)

            // 返回增强后的事件数据
            // breadcrumbs已经在mapEventForFrontend中从event.breadcrumbs列解析,不需要再覆盖
            return {
                ...mappedEvent,
                parsedStack,
                originalStack,
                sourceMapStatus,
                session_id: sessionId,
                replayId,
                environment,
                relatedErrors,
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
     * 根据 replayId 查询所有关联的错误事件
     *
     * @param replayId - Replay ID
     * @returns 错误事件列表，包含 id, message, timestamp, errorType
     */
    async getErrorsByReplayId(replayId: string): Promise<Array<{ id: string; message: string; timestamp: string; errorType: string }>> {
        try {
            const query = `
                SELECT
                    id,
                    event_type,
                    error_message,
                    timestamp,
                    event_data,
                    http_url,
                    http_status,
                    resource_url,
                    resource_type
                FROM monitor_events
                WHERE JSONExtractString(event_data, 'replayId') = {replayId:String}
                  AND event_type IN ('error', 'unhandledrejection')
                ORDER BY timestamp ASC
            `

            const result = await this.clickhouseClient.query({
                query,
                query_params: { replayId },
            })

            const data = (await result.json()) as any

            if (!data.data || data.data.length === 0) {
                this.logger.log(`No errors found for replayId: ${replayId}`)
                return []
            }

            this.logger.log(`Found ${data.data.length} errors for replayId: ${replayId}`)

            // 解析错误数据并区分错误类型
            const errors = data.data.map((row: any) => {
                let message = row.error_message || ''
                let errorType = 'error' // 默认为 JavaScript 错误

                // 尝试从 event_data 中提取更详细的信息
                if (row.event_data) {
                    try {
                        const eventData = JSON.parse(row.event_data)
                        message = eventData.message || message
                    } catch (error) {
                        // JSON 解析失败，使用 error_message
                    }
                }

                // 区分错误类型
                if (row.event_type === 'unhandledrejection') {
                    errorType = 'unhandledrejection'
                } else if (row.http_url && row.http_status) {
                    // HTTP 错误：有 http_url 和 http_status
                    errorType = 'httpError'
                    message = `HTTP ${row.http_status} - ${row.http_url}`
                } else if (row.resource_url) {
                    // 资源错误：有 resource_url
                    errorType = 'resourceError'
                    message = `资源加载失败 (${row.resource_type || 'unknown'}) - ${row.resource_url}`
                }

                // 时间戳转换为 ISO 格式（ClickHouse 返回的是 UTC+8）
                const timestamp = new Date(row.timestamp).toISOString()

                return {
                    id: row.id,
                    message,
                    timestamp,
                    errorType,
                }
            })

            return errors
        } catch (error) {
            this.logger.error(`Failed to get errors by replayId ${replayId}: ${error.message}`)
            return []
        }
    }

    /**
     * 根据 appId 和错误时间查找对应的 replayId
     *
     * Session Replay 在错误发生后 10 秒才上报，所以需要查找：
     * - 同一个 appId
     * - 时间最接近错误发生后 10 秒的 replay 事件
     * - trigger = 'error'
     */
    private async findReplayIdBySession(sessionId: string, errorTimestamp: string): Promise<string | null> {
        try {
            // 从 monitor_events 表中获取 app_id
            const appIdQuery = `
                SELECT app_id
                FROM monitor_events
                WHERE session_id = {sessionId:String}
                LIMIT 1
            `

            const appIdResult = await this.clickhouseClient.query({
                query: appIdQuery,
                query_params: { sessionId },
            })

            const appIdData = (await appIdResult.json()) as any
            if (!appIdData.data || appIdData.data.length === 0) {
                this.logger.log(`[DEBUG] No app_id found for session ${sessionId}`)
                return null
            }

            const appId = appIdData.data[0].app_id

            // 从 session_replays 表中查找最接近的 replayId
            // 使用 abs(timestamp - errorTime - 10s) 找到最接近的 replay
            const query = `
                SELECT
                    replay_id,
                    timestamp,
                    abs(toUnixTimestamp(timestamp) - {errorUnixTime:UInt32} - 10) as time_diff
                FROM session_replays
                WHERE app_id = {appId:String}
                  AND trigger = 'error'
                  AND timestamp >= toDateTime({startTime:String}, 'UTC')
                  AND timestamp <= toDateTime({endTime:String}, 'UTC')
                ORDER BY time_diff ASC
                LIMIT 1
            `

            // 计算时间范围：错误发生后 5-20 秒（允许更大的误差范围）
            // ClickHouse DateTime 格式：'YYYY-MM-DD HH:MM:SS'
            const errorTime = new Date(errorTimestamp)
            const errorUnixTime = Math.floor(errorTime.getTime() / 1000)
            const startTime = new Date(errorTime.getTime() + 5000).toISOString().replace('T', ' ').substring(0, 19)
            const endTime = new Date(errorTime.getTime() + 20000).toISOString().replace('T', ' ').substring(0, 19)

            this.logger.log(
                `[DEBUG] Searching replayId for appId ${appId}, error time: ${errorTimestamp}, range: ${startTime} - ${endTime}`
            )

            const result = await this.clickhouseClient.query({
                query,
                query_params: {
                    appId,
                    errorUnixTime,
                    startTime,
                    endTime,
                },
            })

            const data = (await result.json()) as any

            if (data.data && data.data.length > 0 && data.data[0].replay_id) {
                this.logger.log(
                    `[DEBUG] Found replayId for session ${sessionId}: ${data.data[0].replay_id}, time_diff: ${data.data[0].time_diff}s`
                )
                return data.data[0].replay_id
            }

            this.logger.log(`[DEBUG] No replayId found for session ${sessionId}`)
            return null
        } catch (error) {
            this.logger.error(`Failed to find replayId for session ${sessionId}: ${error.message}`)
            return null
        }
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
            const queryParams: Record<string, any> = {}

            if (appId) {
                whereConditions.push(`app_id = {appId:String}`)
                queryParams.appId = appId
            }
            if (startTime) {
                whereConditions.push(`timestamp >= {startTime:String}`)
                queryParams.startTime = startTime
            }
            if (endTime) {
                whereConditions.push(`timestamp <= {endTime:String}`)
                queryParams.endTime = endTime
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
                this.clickhouseClient.query({ query: eventTypeQuery, query_params: queryParams }),
                this.clickhouseClient.query({ query: errorTrendQuery, query_params: queryParams }),
                this.clickhouseClient.query({ query: webVitalsQuery, query_params: queryParams }),
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
                    countIf(event_type IN ('error', 'exception', 'unhandledrejection')) as error_count,
                    countIf(event_type = 'performance') as performance_count,
                    countIf(event_type = 'webVital') as web_vital_count,
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
                WHERE app_id = {appId:String}
            `

            const result = await this.clickhouseClient.query({
                query,
                query_params: { appId },
            })
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
                WHERE session_id = {sessionId:String}
                ORDER BY timestamp ASC
            `

            const result = await this.clickhouseClient.query({
                query,
                query_params: { sessionId },
            })
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
     * 获取应用的用户列表
     */
    async getUsersByApp(appId: string) {
        try {
            const query = `
                SELECT DISTINCT
                    user_id as id,
                    user_email as email,
                    user_username as username
                FROM monitor_events
                WHERE app_id = {appId:String}
                  AND user_id != ''
                ORDER BY user_id ASC
                LIMIT 1000
            `

            const result = await this.clickhouseClient.query({
                query,
                query_params: { appId },
            })
            const data = await result.json()

            return data.data || []
        } catch (error) {
            this.logger.error(`Failed to get users by app: ${error.message}`, error.stack)
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
                WHERE app_id = {appId:String} AND session_id != ''
                GROUP BY session_id
                ORDER BY start_time DESC
                LIMIT {limit:UInt32}
                OFFSET {offset:UInt32}
            `

            const result = await this.clickhouseClient.query({
                query,
                query_params: { appId, limit, offset },
            })
            const data = await result.json()

            // 获取总数
            const countQuery = `
                SELECT uniq(session_id) as total
                FROM monitor_events
                WHERE app_id = {appId:String} AND session_id != ''
            `
            const countResult = await this.clickhouseClient.query({
                query: countQuery,
                query_params: { appId },
            })
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
                WHERE app_id = {appId:String}
                  AND perf_category = 'http'
                  AND http_duration > {threshold:UInt32}
                GROUP BY http_url, http_method
                ORDER BY avg_duration DESC
                LIMIT {limit:UInt32}
            `

            const result = await this.clickhouseClient.query({
                query,
                query_params: { appId, threshold, limit },
            })
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
                WHERE app_id = {appId:String}
                  AND event_type = 'error'
                  AND error_fingerprint != ''
                GROUP BY error_fingerprint
                ORDER BY total_count DESC
                LIMIT {limit:UInt32}
            `

            const result = await this.clickhouseClient.query({
                query,
                query_params: { appId, limit },
            })
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
                WHERE app_id = {appId:String} AND user_id = {userId:String}
                ORDER BY timestamp DESC
                LIMIT {limit:UInt32}
            `

            const result = await this.clickhouseClient.query({
                query,
                query_params: { appId, userId, limit },
            })
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
     * 返回格式: { sampled: number, total: number, rate: number }
     */
    async getSamplingStats(appId: string) {
        try {
            // 先按事件类型分组统计
            const query = `
                SELECT
                    event_type,
                    AVG(sampling_rate) as avg_rate,
                    COUNT(*) as sampled_count,
                    SUM(1 / sampling_rate) as estimated_total
                FROM monitor_events
                WHERE app_id = {appId:String} AND sampling_sampled = 1
                GROUP BY event_type
            `

            const result = await this.clickhouseClient.query({
                query,
                query_params: { appId },
            })
            const data = await result.json()

            // 聚合计算总体统计
            const stats = data.data as Array<{
                event_type: string
                avg_rate: number
                sampled_count: number
                estimated_total: number
            }>

            if (!stats || stats.length === 0) {
                return {
                    sampled: 0,
                    total: 0,
                    rate: 0,
                }
            }

            const totalSampled = stats.reduce((sum, item) => sum + item.sampled_count, 0)
            const totalEstimated = stats.reduce((sum, item) => sum + item.estimated_total, 0)
            const overallRate = totalSampled / totalEstimated

            return {
                sampled: totalSampled,
                total: Math.round(totalEstimated),
                rate: overallRate,
            }
        } catch (error) {
            this.logger.error(`Failed to get sampling stats: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取会话统计数据
     */
    async getSessionStats(params: { appId: string; timeWindow?: 'hour' | 'day' | 'week' }) {
        try {
            const { appId, timeWindow = 'day' } = params

            // 计算时间范围
            const timeRanges = {
                hour: 'now() - INTERVAL 1 HOUR',
                day: 'now() - INTERVAL 1 DAY',
                week: 'now() - INTERVAL 7 DAY',
            }

            const timeCondition = timeRanges[timeWindow]

            const query = `
                SELECT
                    uniq(session_id) as total_sessions,
                    uniqIf(session_id, timestamp >= now() - INTERVAL 30 MINUTE) as active_sessions,
                    avg(session_duration) as avg_duration,
                    countIf(session_page_views = 1) / count() as bounce_rate
                FROM monitor_events
                WHERE app_id = {appId:String}
                    AND session_id != ''
                    AND timestamp >= ${timeCondition}
            `

            const result = await this.clickhouseClient.query({
                query,
                query_params: { appId },
            })
            const data = await result.json()

            // 返回统计数据，如果没有数据则返回默认值
            return (
                data.data[0] || {
                    total_sessions: 0,
                    active_sessions: 0,
                    avg_duration: 0,
                    bounce_rate: 0,
                }
            )
        } catch (error) {
            this.logger.error(`Failed to get session stats: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 获取会话回放数据
     */
    async getSessionReplay(sessionId: string) {
        try {
            const query = `
                SELECT
                    session_replay_events,
                    session_replay_size,
                    event_data,
                    timestamp
                FROM monitor_events
                WHERE session_id = {sessionId:String}
                    AND event_type = 'sessionReplay'
                    AND session_replay_events != ''
                ORDER BY timestamp DESC
                LIMIT 1
            `

            const result = await this.clickhouseClient.query({
                query,
                query_params: { sessionId },
            })
            const data = await result.json()

            if (data.data.length === 0) {
                return {
                    events: [],
                    metadata: {
                        message: 'No replay data found for this session',
                    },
                }
            }

            const record = data.data[0] as any

            // 解析 rrweb 事件数据
            const events = record.session_replay_events ? JSON.parse(record.session_replay_events) : []

            // 解析元数据
            const metadata = record.event_data ? JSON.parse(record.event_data) : {}

            return {
                events,
                metadata: {
                    ...metadata,
                    size: record.session_replay_size,
                    timestamp: record.timestamp,
                },
            }
        } catch (error) {
            this.logger.error(`Failed to get session replay: ${error.message}`, error.stack)
            throw error
        }
    }
}
