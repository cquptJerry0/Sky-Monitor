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
                created_at DateTime DEFAULT now()
            ) ENGINE = MergeTree ()
            PARTITION BY toYYYYMM (timestamp)
            ORDER BY (app_id, timestamp, event_type)
            SETTINGS index_granularity = 8192
        `

        try {
            await this.clickhouseClient.query({ query })
        } catch (error) {
            this.logger.error(`Failed to create monitor_events table: ${error.message}`)
            throw error
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
                    primary_key
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
