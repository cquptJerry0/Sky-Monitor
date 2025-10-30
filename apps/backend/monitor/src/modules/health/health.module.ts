import { Module } from '@nestjs/common'

import { ClickhouseModule } from '../../fundamentals/clickhouse/clickhouse.module'
import { HealthController } from './health.controller'
import { HealthService } from './health.service'

@Module({
    imports: [ClickhouseModule],
    controllers: [HealthController],
    providers: [HealthService],
    exports: [HealthService],
})
export class HealthModule {}
