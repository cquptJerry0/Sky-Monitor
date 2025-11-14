import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { DashboardEntity } from '../../entities/dashboard.entity'
import { DashboardWidgetEntity } from '../../entities/dashboard-widget.entity'
import {
    CreateDashboardDto,
    CreateWidgetDto,
    DeleteDashboardDto,
    DeleteWidgetDto,
    ExecuteQueryDto,
    UpdateDashboardDto,
    UpdateWidgetDto,
    UpdateWidgetsLayoutDto,
} from './dashboard.dto'
import { QueryBuilderService } from './query-builder.service'

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(DashboardEntity)
        private readonly dashboardRepository: Repository<DashboardEntity>,
        @InjectRepository(DashboardWidgetEntity)
        private readonly widgetRepository: Repository<DashboardWidgetEntity>,
        @Inject('CLICKHOUSE_CLIENT')
        private readonly clickhouseClient: ClickHouseClient,
        private readonly queryBuilderService: QueryBuilderService
    ) {}

    /**
     * 创建 Dashboard
     */
    async createDashboard(payload: CreateDashboardDto, userId: number) {
        const dashboard = new DashboardEntity({
            name: payload.name,
            description: payload.description,
            userId,
            isDefault: false,
        })

        return await this.dashboardRepository.save(dashboard)
    }

    /**
     * 获取用户的所有 Dashboard
     */
    async listDashboards(userId: number) {
        const dashboards = await this.dashboardRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        })

        return dashboards
    }

    /**
     * 获取 Dashboard 详情 (包含所有 Widget)
     */
    async getDashboard(id: string, userId: number) {
        const dashboard = await this.dashboardRepository.findOne({
            where: { id, userId },
            relations: ['widgets'],
        })

        if (!dashboard) {
            throw new NotFoundException('Dashboard not found')
        }

        return dashboard
    }

    /**
     * 更新 Dashboard
     */
    async updateDashboard(payload: UpdateDashboardDto, userId: number) {
        const dashboard = await this.dashboardRepository.findOne({
            where: { id: payload.id, userId },
        })

        if (!dashboard) {
            throw new NotFoundException('Dashboard not found')
        }

        if (payload.name) {
            dashboard.name = payload.name
        }

        if (payload.description !== undefined) {
            dashboard.description = payload.description
        }

        return await this.dashboardRepository.save(dashboard)
    }

    /**
     * 删除 Dashboard
     */
    async deleteDashboard(payload: DeleteDashboardDto, userId: number) {
        const result = await this.dashboardRepository.delete({
            id: payload.id,
            userId,
        })

        if (result.affected === 0) {
            throw new NotFoundException('Dashboard not found')
        }

        return result.affected
    }

    /**
     * 创建 Widget
     */
    async createWidget(payload: CreateWidgetDto, userId: number) {
        const dashboard = await this.dashboardRepository.findOne({
            where: { id: payload.dashboardId, userId },
        })

        if (!dashboard) {
            throw new NotFoundException('Dashboard not found')
        }

        const widget = new DashboardWidgetEntity({
            dashboardId: payload.dashboardId,
            title: payload.title,
            widgetType: payload.widgetType,
            queries: payload.queries as any,
            displayConfig: payload.displayConfig as any,
            layout: payload.layout as any,
        })

        return await this.widgetRepository.save(widget)
    }

    /**
     * 更新 Widget
     */
    async updateWidget(payload: UpdateWidgetDto, userId: number) {
        const widget = await this.widgetRepository.findOne({
            where: { id: payload.id },
            relations: ['dashboard'],
        })

        if (!widget || widget.dashboard.userId !== userId) {
            throw new NotFoundException('Widget not found')
        }

        if (payload.title) widget.title = payload.title
        if (payload.widgetType) widget.widgetType = payload.widgetType
        if (payload.queries) widget.queries = payload.queries as any
        if (payload.displayConfig) widget.displayConfig = payload.displayConfig as any
        if (payload.layout) widget.layout = payload.layout as any

        return await this.widgetRepository.save(widget)
    }

    /**
     * 删除 Widget
     */
    async deleteWidget(payload: DeleteWidgetDto, userId: number) {
        const widget = await this.widgetRepository.findOne({
            where: { id: payload.id },
            relations: ['dashboard'],
        })

        if (!widget || widget.dashboard.userId !== userId) {
            throw new NotFoundException('Widget not found')
        }

        const result = await this.widgetRepository.delete({ id: payload.id })

        return result.affected
    }

    /**
     * 批量更新 Widget 布局 (拖拽后保存)
     */
    async updateWidgetsLayout(payload: UpdateWidgetsLayoutDto, userId: number) {
        const dashboard = await this.dashboardRepository.findOne({
            where: { id: payload.dashboardId, userId },
        })

        if (!dashboard) {
            throw new NotFoundException('Dashboard not found')
        }

        const updatePromises = payload.layouts.map(async ({ id, layout }) => {
            const widget = await this.widgetRepository.findOne({ where: { id, dashboardId: payload.dashboardId } })
            if (widget) {
                widget.layout = layout as any
                return this.widgetRepository.save(widget)
            }
        })

        await Promise.all(updatePromises)

        return { success: true }
    }

    /**
     * 执行查询
     */
    async executeQuery(payload: ExecuteQueryDto, userId: number) {
        // 1. 获取 Widget 配置
        const widget = await this.widgetRepository.findOne({
            where: { id: payload.widgetId },
            relations: ['dashboard'],
        })

        if (!widget) {
            throw new NotFoundException('Widget 不存在')
        }

        // 2. 验证权限
        if (widget.dashboard.userId !== userId) {
            throw new NotFoundException('无权访问此 Widget')
        }

        // 3. 解析时间范围
        const timeRange = {
            start: new Date(payload.timeRange.start),
            end: new Date(payload.timeRange.end),
        }

        // 4. 执行所有查询
        const results = await Promise.all(
            widget.queries.map(async query => {
                const sql = this.queryBuilderService.buildQuery(query, timeRange, payload.appId)

                const resultSet = await this.clickhouseClient.query({
                    query: sql,
                    format: 'JSONEachRow',
                })

                const data = await resultSet.json()

                return {
                    queryId: query.id,
                    legend: query.legend,
                    color: query.color,
                    data,
                }
            })
        )

        return {
            widgetId: widget.id,
            widgetType: widget.widgetType,
            title: widget.title,
            results,
        }
    }
}
