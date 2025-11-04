import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ApplicationEntity } from '../../entities/application.entity'
import { MonitoringController } from './monitoring.controller'
import { MonitoringHealthController } from './monitoring-health.controller'
import { MonitoringHealthService } from './monitoring-health.service'
import { MonitoringService } from './monitoring.service'

@Module({
    imports: [
        TypeOrmModule.forFeature([ApplicationEntity]),
        BullModule.registerQueue({
            name: 'sourcemap-parser',
        }),
    ],
    controllers: [MonitoringController, MonitoringHealthController],
    providers: [MonitoringService, MonitoringHealthService],
    exports: [MonitoringService, MonitoringHealthService],
})
export class MonitoringModule {}
