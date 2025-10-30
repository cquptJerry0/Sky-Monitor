import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ApplicationEntity } from '../../entities/application.entity'
import { MonitoringController } from './monitoring.controller'
import { MonitoringHealthController } from './monitoring-health.controller'
import { MonitoringHealthService } from './monitoring-health.service'
import { MonitoringService } from './monitoring.service'

@Module({
    imports: [TypeOrmModule.forFeature([ApplicationEntity])],
    controllers: [MonitoringController, MonitoringHealthController],
    providers: [MonitoringService, MonitoringHealthService],
    exports: [MonitoringService, MonitoringHealthService],
})
export class MonitoringModule {}
