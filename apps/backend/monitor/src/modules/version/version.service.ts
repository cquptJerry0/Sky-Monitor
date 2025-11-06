import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable, Logger } from '@nestjs/common'

@Injectable()
export class VersionService {
    constructor(@Inject('CLICKHOUSE_CLIENT') private clickhouseClient: ClickHouseClient) {}
    getVersion() {
        return '1.0.0'
    }

    async tracking(params: { event_type: string; message: string }) {
        Logger.log('Tracking called', params)
        return { success: true, data: params }
    }

    async span() {
        Logger.log('Span called')
        return { success: true, data: [] }
    }
}
