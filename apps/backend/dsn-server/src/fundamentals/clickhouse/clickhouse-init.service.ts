import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'

@Injectable()
export class ClickhouseInitService implements OnModuleInit {
    private readonly logger = new Logger(ClickhouseInitService.name)

    constructor(@Inject('CLICKHOUSE_CLIENT') private clickhouseClient: ClickHouseClient) {}

    async onModuleInit() {
        this.logger.log('Initializing ClickHouse database')
        await this.initializeTables()
        this.logger.log('ClickHouse initialization completed')
    }

    async initializeTables() {
        try {
            await this.createMonitorEventsTable()
            this.logger.log('monitor_events table is ready')
        } catch (error) {
            this.logger.error(`Failed to initialize ClickHouse tables: ${error.message}`, error.stack)
            throw error
        }
    }

    private async createMonitorEventsTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS monitor_events (
                id UUID DEFAULT generateUUIDv4 (),
                app_id String,
                event_type String,
                event_name String DEFAULT '',
                event_data String,
                path String DEFAULT '',
                user_agent String DEFAULT '',
                timestamp DateTime DEFAULT now(),
                created_at DateTime DEFAULT now(),
                
                -- 错误相关字段
                error_message String DEFAULT '',
                error_stack String DEFAULT '',
                error_lineno UInt32 DEFAULT 0,
                error_colno UInt32 DEFAULT 0,
                error_fingerprint String DEFAULT '',
                
                -- 设备信息
                device_browser String DEFAULT '',
                device_browser_version String DEFAULT '',
                device_os String DEFAULT '',
                device_os_version String DEFAULT '',
                device_type String DEFAULT '',
                device_screen String DEFAULT '',
                
                -- 网络信息
                network_type String DEFAULT '',
                network_rtt UInt32 DEFAULT 0,
                
                -- 框架信息
                framework String DEFAULT '',
                component_name String DEFAULT '',
                component_stack String DEFAULT '',
                
                -- HTTP 错误相关
                http_url String DEFAULT '',
                http_method String DEFAULT '',
                http_status UInt16 DEFAULT 0,
                http_duration UInt32 DEFAULT 0,
                
                -- 资源错误相关
                resource_url String DEFAULT '',
                resource_type String DEFAULT ''
            ) ENGINE = MergeTree ()
            PARTITION BY toYYYYMM (timestamp)
            ORDER BY (app_id, timestamp, event_type, error_fingerprint)
            SETTINGS index_granularity = 8192
        `

        try {
            await this.clickhouseClient.query({ query })

            // 创建索引
            await this.createIndexes()
        } catch (error) {
            this.logger.error(`Failed to create monitor_events table: ${error.message}`)
            throw error
        }
    }

    private async createIndexes() {
        const indexes = [
            'ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_error_fingerprint (error_fingerprint) TYPE bloom_filter GRANULARITY 4',
            'ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_framework (framework) TYPE set(10) GRANULARITY 4',
            'ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_event_type (event_type) TYPE set(20) GRANULARITY 4',
            'ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_http_status (http_status) TYPE set(100) GRANULARITY 4',
        ]

        for (const indexQuery of indexes) {
            try {
                await this.clickhouseClient.query({ query: indexQuery })
            } catch (error) {
                // 索引可能已存在，忽略错误
                this.logger.warn(`Index creation warning: ${error.message}`)
            }
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            const query = `
                SELECT name 
                FROM system.tables 
                WHERE database = currentDatabase() AND name = 'monitor_events'
            `
            const result = await this.clickhouseClient.query({ query })
            const data = await result.json()
            return data.data.length > 0
        } catch (error) {
            this.logger.error(`Health check failed: ${error.message}`)
            return false
        }
    }

    async getTableStats() {
        try {
            const query = `
                SELECT 
                    name,
                    engine,
                    partition_key,
                    primary_key,
                    modification_time
                FROM system.tables 
                WHERE database = currentDatabase() AND name = 'monitor_events'
            `
            const result = await this.clickhouseClient.query({ query })
            return await result.json()
        } catch (error) {
            this.logger.error(`Failed to get table stats: ${error.message}`)
            return null
        }
    }
}
