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
                    created_at
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
                    max(timestamp) as last_seen
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
}
