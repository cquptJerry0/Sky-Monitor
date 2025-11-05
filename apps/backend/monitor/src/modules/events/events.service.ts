import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable, Logger } from '@nestjs/common'

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name)

    constructor(@Inject('CLICKHOUSE_CLIENT') private clickhouseClient: ClickHouseClient) {}

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

            return data.data[0] || null
        } catch (error) {
            this.logger.error(`Failed to get event by id: ${error.message}`, error.stack)
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
}
