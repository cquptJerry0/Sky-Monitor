import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable, Logger } from '@nestjs/common'

@Injectable()
export class MonitoringHealthService {
    private readonly logger = new Logger(MonitoringHealthService.name)

    constructor(@Inject('CLICKHOUSE_CLIENT') private clickhouseClient: ClickHouseClient) {}

    async verifyEventPipeline() {
        const result = {
            clickhouse: {
                connected: false,
                tableExists: false,
                stats: null,
                error: null,
            },
        }

        try {
            const testQuery = 'SELECT 1'
            await this.clickhouseClient.query({ query: testQuery })
            result.clickhouse.connected = true
            this.logger.log('ClickHouse connected')

            const tableCheckQuery = `SELECT name FROM system.tables WHERE database = currentDatabase() AND name = 'monitor_events'`
            const tableCheckResult = await this.clickhouseClient.query({ query: tableCheckQuery })
            const tableData = await tableCheckResult.json()
            result.clickhouse.tableExists = tableData.data.length > 0
            this.logger.log(`Table check: ${result.clickhouse.tableExists ? 'EXISTS' : 'NOT FOUND'}`)

            if (result.clickhouse.tableExists) {
                const statsQuery = `SELECT count() as total_rows FROM monitor_events`
                const statsResult = await this.clickhouseClient.query({ query: statsQuery })
                result.clickhouse.stats = await statsResult.json()
                this.logger.log(`Table stats retrieved: ${JSON.stringify(result.clickhouse.stats)}`)
            }
        } catch (error) {
            result.clickhouse.connected = false
            result.clickhouse.error = error.message
            this.logger.error(`Pipeline verification failed: ${error.message}`, error.stack)
        }

        return result
    }

    async testEventWrite() {
        try {
            const now = new Date()
            const year = now.getUTCFullYear()
            const month = String(now.getUTCMonth() + 1).padStart(2, '0')
            const day = String(now.getUTCDate()).padStart(2, '0')
            const hours = String(now.getUTCHours()).padStart(2, '0')
            const minutes = String(now.getUTCMinutes()).padStart(2, '0')
            const seconds = String(now.getUTCSeconds()).padStart(2, '0')
            const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

            const testEvent = {
                app_id: 'test_app',
                event_type: 'test',
                event_name: 'pipeline_test',
                event_data: JSON.stringify({
                    message: 'Pipeline verification event',
                }),
                path: '/test',
                user_agent: 'Pipeline Tester',
                timestamp,
            }

            await this.clickhouseClient.insert({
                table: 'monitor_events',
                values: [testEvent],
                format: 'JSONEachRow',
            })

            this.logger.log('Test event written successfully')
            return {
                success: true,
                message: 'Test event written successfully',
                event: testEvent,
            }
        } catch (error) {
            this.logger.error(`Failed to write test event: ${error.message}`, error.stack)
            return {
                success: false,
                error: error.message,
            }
        }
    }

    async getRecentEvents(limit: number = 10) {
        try {
            const safeLimit = Math.min(Math.max(1, limit), 1000)
            const query = `SELECT id, app_id, event_type, event_name, timestamp, created_at FROM monitor_events ORDER BY timestamp DESC LIMIT ${safeLimit}`
            const result = await this.clickhouseClient.query({ query })
            const data = await result.json()
            return {
                success: true,
                data: data.data,
                count: data.data.length,
            }
        } catch (error) {
            this.logger.error(`Failed to get recent events: ${error.message}`)
            return {
                success: false,
                error: error.message,
            }
        }
    }
}
