import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { ApplicationEntity } from '../../entities/application.entity'
import { DashboardEntity } from '../../entities/dashboard.entity'
import { DashboardWidgetEntity } from '../../entities/dashboard-widget.entity'
import { generateDefaultDashboardWidgets } from '../dashboard/default-dashboard.template'

@Injectable()
export class ApplicationService {
    private readonly logger = new Logger(ApplicationService.name)

    constructor(
        @InjectRepository(ApplicationEntity)
        private readonly applicationRepository: Repository<ApplicationEntity>,
        @InjectRepository(DashboardEntity)
        private readonly dashboardRepository: Repository<DashboardEntity>,
        @InjectRepository(DashboardWidgetEntity)
        private readonly widgetRepository: Repository<DashboardWidgetEntity>,
        @Inject('CLICKHOUSE_CLIENT')
        private readonly clickhouseClient: ClickHouseClient
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

            const defaultWidgets = generateDefaultDashboardWidgets(appId)

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

    async update(payload: { appId: string; name?: string; url?: string; description?: string }, userId: number) {
        const app = await this.applicationRepository.findOne({
            where: { appId: payload.appId, userId },
        })

        if (!app) {
            throw new NotFoundException('Application not found')
        }

        if (payload.name !== undefined) {
            app.name = payload.name
        }

        if (payload.url !== undefined) {
            app.url = payload.url
        }

        if (payload.description !== undefined) {
            app.description = payload.description
        }

        return await this.applicationRepository.save(app)
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
        const app = await this.applicationRepository.findOne({
            where: {
                appId: payload.appId,
                userId: payload.userId,
            },
        })

        if (!app) {
            throw new NotFoundException('Application not found')
        }

        this.deleteClickHouseData(payload.appId).catch(error => {
            this.logger.error(`Failed to delete ClickHouse data for appId ${payload.appId}: ${error.message}`)
        })

        const res = await this.applicationRepository.delete({
            appId: payload.appId,
            userId: payload.userId,
        })

        this.logger.log(`Application deleted: appId=${payload.appId}, userId=${payload.userId}`)

        return res.affected
    }

    private async deleteClickHouseData(appId: string) {
        try {
            this.logger.log(`Deleting ClickHouse data for appId: ${appId}`)

            await this.clickhouseClient.command({
                query: `ALTER TABLE monitor_events DELETE WHERE app_id = '${appId}'`,
            })

            await this.clickhouseClient.command({
                query: `ALTER TABLE session_replays DELETE WHERE app_id = '${appId}'`,
            })

            this.logger.log(`ClickHouse data deletion initiated for appId: ${appId}`)
        } catch (error) {
            this.logger.error(`Failed to delete ClickHouse data for appId ${appId}: ${error.message}`)
            throw error
        }
    }

    /**
     * 临时方法: 为现有应用初始化默认Dashboard
     * 用于修复之前创建的应用没有默认Dashboard的问题
     */
    async initDashboardForApp(appId: string, userId: number) {
        // 验证应用是否存在且属于当前用户
        const app = await this.applicationRepository.findOne({
            where: { appId, userId },
        })

        if (!app) {
            throw new NotFoundException('Application not found')
        }

        // 检查是否已经有Dashboard
        const existingDashboard = await this.dashboardRepository.findOne({
            where: { appId, userId },
        })

        if (existingDashboard) {
            this.logger.warn(`Dashboard already exists for app: ${appId}`)
            return existingDashboard
        }

        // 创建默认Dashboard
        const dashboard = new DashboardEntity({
            name: `${appId} 监控面板`,
            description: '自动创建的默认监控面板',
            userId,
            appId,
            isDefault: true,
        })

        const savedDashboard = await this.dashboardRepository.save(dashboard)

        // 创建默认Widgets
        const defaultWidgets = generateDefaultDashboardWidgets(appId)

        const widgets = this.widgetRepository.create(
            defaultWidgets.map(widgetConfig => ({
                dashboardId: savedDashboard.id,
                ...widgetConfig,
            })) as any
        )

        await this.widgetRepository.save(widgets)

        this.logger.log(`Initialized default dashboard with ${widgets.length} widgets for app: ${appId}`)

        return savedDashboard
    }
}
