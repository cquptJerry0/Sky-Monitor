import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AlertRule } from '../../entities/alert-rule.entity'
import { ApplicationModule } from '../application/application.module'
import { AlertsController } from './alerts.controller'
import { AlertsService } from './alerts.service'

@Module({
    imports: [TypeOrmModule.forFeature([AlertRule]), ApplicationModule],
    controllers: [AlertsController],
    providers: [AlertsService],
    exports: [AlertsService],
})
export class AlertsModule {}
