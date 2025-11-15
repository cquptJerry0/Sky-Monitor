import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ApplicationEntity } from '../../entities/application.entity'
import { DashboardEntity } from '../../entities/dashboard.entity'
import { DashboardWidgetEntity } from '../../entities/dashboard-widget.entity'
import { ApplicationController } from './application.controller'
import { ApplicationService } from './application.service'

@Module({
    imports: [TypeOrmModule.forFeature([ApplicationEntity, DashboardEntity, DashboardWidgetEntity])],
    controllers: [ApplicationController],
    providers: [ApplicationService],
    exports: [ApplicationService],
})
export class ApplicationModule {}
