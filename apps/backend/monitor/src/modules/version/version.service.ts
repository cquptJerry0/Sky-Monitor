import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable, Logger } from '@nestjs/common'

@Injectable()
export class VersionService {
    constructor(@Inject('CLICKHOUSE_CLIENT') private clickhouseClient: ClickHouseClient) {}
    getVersion() {
        return '1.0.0'
    }

    async tracking(params: { event_type: string; message: string }) {
        const res = await this.clickhouseClient.insert({
            table: 'base_monitor_storage',
            values: params,
            columns: ['event_type', 'message'],
            format: 'JSONEachRow',
        })

        Logger.log('Query result', JSON.stringify(res.summary))
    }

    async span() {
        // 从物化表中查
        // const query = `
        //             SELECT *
        // FROM kafka_to_monitor_data
        //         `
        // const query = `
        //     SELECT *
        //     FROM monitor_data
        //     WHERE key = '1'
        // `
        const query = `
            SELECT * FROM base_monitor_view;
        `

        const res = await this.clickhouseClient.query({
            query,
        })

        const queryResult = await res.json()
        Logger.log('Query result', queryResult)

        return queryResult.data
    }
}
