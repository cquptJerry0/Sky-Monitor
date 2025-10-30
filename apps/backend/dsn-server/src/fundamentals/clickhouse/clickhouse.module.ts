import { createClient } from '@clickhouse/client'
import { DynamicModule, Global, Module } from '@nestjs/common'

import { ClickhouseInitService } from './clickhouse-init.service'

@Global()
@Module({})
export class ClickhouseModule {
    static forRoot(options: { url: string; username: string; password: string }): DynamicModule {
        return {
            module: ClickhouseModule,
            providers: [
                {
                    provide: 'CLICKHOUSE_CLIENT',
                    useFactory: () => {
                        // 确保只初始化一次客户端
                        return createClient(options)
                    },
                },
                ClickhouseInitService,
            ],
            exports: ['CLICKHOUSE_CLIENT', ClickhouseInitService],
        }
    }
}
