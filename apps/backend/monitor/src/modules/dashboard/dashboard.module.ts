import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { DashboardEntity } from '../../entities/dashboard.entity'
import { DashboardWidgetEntity } from '../../entities/dashboard-widget.entity'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'
import { QueryBuilderService } from './query-builder.service'

@Module({
    imports: [TypeOrmModule.forFeature([DashboardEntity, DashboardWidgetEntity])],
    controllers: [DashboardController],
    providers: [DashboardService, QueryBuilderService],
    exports: [DashboardService],
})
export class DashboardModule {}
