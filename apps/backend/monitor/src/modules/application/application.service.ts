import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { ApplicationEntity } from '../../entities/application.entity'
import { DashboardEntity } from '../../entities/dashboard.entity'
import { DashboardWidgetEntity } from '../../entities/dashboard-widget.entity'
import { generateDefaultWidgets } from './default-widgets.config'

@Injectable()
export class ApplicationService {
    private readonly logger = new Logger(ApplicationService.name)

    constructor(
        @InjectRepository(ApplicationEntity)
        private readonly applicationRepository: Repository<ApplicationEntity>,
        @InjectRepository(DashboardEntity)
        private readonly dashboardRepository: Repository<DashboardEntity>,
        @InjectRepository(DashboardWidgetEntity)
        private readonly widgetRepository: Repository<DashboardWidgetEntity>
    ) {}

    async create(payload) {
        const saved = await this.applicationRepository.save(payload)

        await this.createDefaultDashboard(saved.appId, saved.userId)

        return saved
    }

    private async createDefaultDashboard(appId: string, userId: number) {
        try {
            const dashboard = new DashboardEntity({
                name: `${appId} 监控面板`,
                description: '自动创建的默认监控面板',
                userId,
                appId,
                isDefault: true,
            })

            const savedDashboard = await this.dashboardRepository.save(dashboard)

            const defaultWidgets = generateDefaultWidgets(savedDashboard.id, appId)

            const widgets = this.widgetRepository.create(
                defaultWidgets.map(widgetConfig => ({
                    dashboardId: savedDashboard.id,
                    ...widgetConfig,
                })) as any
            )

            await this.widgetRepository.save(widgets)

            this.logger.log(`Created default dashboard with ${widgets.length} widgets for app: ${appId}`)
        } catch (error) {
            this.logger.error(`Failed to create default dashboard for app ${appId}: ${error.message}`, error.stack)
        }
    }

    async update(payload) {
        return payload
    }

    async list(params: { userId: number }) {
        const [data, count] = await this.applicationRepository.findAndCount({
            where: { userId: params.userId },
        })

        return {
            applications: data,
            count,
        }
    }

    async delete(payload: { appId: string; userId: number }) {
        const res = await this.applicationRepository.delete({
            appId: payload.appId,
            userId: payload.userId,
        })

        if (res.affected === 0) {
            return new NotFoundException('Application not found')
        }

        return res.affected
    }
}
