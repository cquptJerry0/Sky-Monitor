import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable, Logger } from '@nestjs/common'

@Injectable()
export class ClickhouseService {
    private readonly logger = new Logger(ClickhouseService.name)

    constructor(@Inject('CLICKHOUSE_CLIENT') private readonly client: ClickHouseClient) {}

    async query<T = any>(options: { query: string }): Promise<T> {
        try {
            const result = await this.client.query({
                query: options.query,
                format: 'JSONEachRow',
            })
            return (await result.json()) as T
        } catch (error) {
            this.logger.error(`Query failed: ${error.message}`, error.stack)
            throw error
        }
    }

    async insert(options: { table: string; values: any[] }) {
        try {
            return await this.client.insert({
                table: options.table,
                values: options.values,
                format: 'JSONEachRow',
            })
        } catch (error) {
            this.logger.error(`Insert failed: ${error.message}`, error.stack)
            throw error
        }
    }

    async command(options: { query: string }) {
        try {
            return await this.client.command({
                query: options.query,
            })
        } catch (error) {
            this.logger.error(`Command failed: ${error.message}`, error.stack)
            throw error
        }
    }

    getClient(): ClickHouseClient {
        return this.client
    }
}
