import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ClickhouseModule } from '../../fundamentals/clickhouse/clickhouse.module'
import { HealthController } from './health.controller'
import { HealthService } from './health.service'

@Module({
    imports: [ClickhouseModule, TypeOrmModule],
    controllers: [HealthController],
    providers: [HealthService],
    exports: [HealthService],
})
export class HealthModule {}
