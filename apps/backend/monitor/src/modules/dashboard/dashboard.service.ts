import { ClickHouseClient } from '@clickhouse/client'
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { DashboardEntity } from '../../entities/dashboard.entity'
import { DashboardWidgetEntity } from '../../entities/dashboard-widget.entity'
import {
    CreateDashboardDto,
    CreateWidgetDto,
    CreateWidgetFromTemplateDto,
    DeleteDashboardDto,
    DeleteWidgetDto,
    ExecuteQueryDto,
    UpdateDashboardDto,
    UpdateWidgetDto,
    UpdateWidgetsLayoutDto,
} from './dashboard.dto'
import { generateDefaultDashboardWidgets } from './default-dashboard.template'
import { QueryBuilderService } from './query-builder.service'

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name)

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
            appId: payload.appId,
            isDefault: false,
        })

        return await this.dashboardRepository.save(dashboard)
    }

    /**
     * 获取用户的所有 Dashboard
     * @param userId 用户ID
     * @param appId 应用ID (可选,如果提供则只返回该应用的dashboard)
     */
    async listDashboards(userId: number, appId?: string) {
        const where: any = { userId }

        if (appId) {
            where.appId = appId
        }

        const dashboards = await this.dashboardRepository.find({
            where,
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

        if (payload.appId !== undefined) {
            dashboard.appId = payload.appId
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
     * 计算新Widget应该放置的Y坐标(最下面)
     */
    private async calculateBottomY(dashboardId: string): Promise<number> {
        const widgets = await this.widgetRepository.find({
            where: { dashboardId },
        })

        if (widgets.length === 0) {
            return 0
        }

        // 找到最大的 y + h
        const maxBottom = Math.max(...widgets.map(w => (w.layout?.y || 0) + (w.layout?.h || 0)))
        return maxBottom
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

        // 计算新Widget的Y坐标(放在最下面)
        const bottomY = await this.calculateBottomY(payload.dashboardId)
        const layout = {
            ...payload.layout,
            y: bottomY,
        }

        const widget = new DashboardWidgetEntity({
            dashboardId: payload.dashboardId,
            title: payload.title,
            widgetType: payload.widgetType,
            queries: payload.queries as any,
            displayConfig: payload.displayConfig as any,
            layout: layout as any,
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

        // 3. 解析时间范围并加上 8 小时偏移 (因为 ClickHouse 中的数据是 UTC+8)
        const startDate = new Date(payload.timeRange.start)
        const endDate = new Date(payload.timeRange.end)

        // 加上 8 小时偏移
        const timeRange = {
            start: new Date(startDate.getTime() + 8 * 60 * 60 * 1000),
            end: new Date(endDate.getTime() + 8 * 60 * 60 * 1000),
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

    /**
     * 恢复默认 Widget
     * 删除当前 Dashboard 的所有 Widget 并重新创建默认 Widget
     */
    async resetWidgets(dashboardId: string, userId: number) {
        const dashboard = await this.dashboardRepository.findOne({
            where: { id: dashboardId, userId },
        })

        if (!dashboard) {
            throw new NotFoundException('Dashboard not found')
        }

        if (!dashboard.appId) {
            throw new BadRequestException('只有关联应用的 Dashboard 才能恢复默认 Widget')
        }

        await this.widgetRepository.delete({ dashboardId })

        const defaultWidgets = generateDefaultDashboardWidgets(dashboard.appId)

        const widgets = this.widgetRepository.create(
            defaultWidgets.map(widgetConfig => ({
                dashboardId,
                ...widgetConfig,
            })) as any
        )

        const savedWidgets = await this.widgetRepository.save(widgets)

        this.logger.log(`Reset ${savedWidgets.length} default widgets for dashboard: ${dashboardId}`)

        return savedWidgets
    }

    /**
     * 获取Widget模版列表
     * 只返回大数字模版
     */
    async getTemplates() {
        return {
            templates: [
                {
                    type: 'big_number',
                    name: '大数字',
                    description: '显示总事件数的大数字卡片',
                    widgetType: 'big_number',
                },
            ],
        }
    }

    /**
     * 从模版创建Widget - 支持大数字和折线图
     * 使用fields+conditions构建查询,让后端自动添加时间范围
     */
    async createWidgetFromTemplate(payload: CreateWidgetFromTemplateDto, userId: number) {
        const dashboard = await this.dashboardRepository.findOne({
            where: { id: payload.dashboardId, userId },
        })

        if (!dashboard) {
            throw new NotFoundException('Dashboard not found')
        }

        if (!dashboard.appId) {
            throw new BadRequestException('Dashboard必须关联应用')
        }

        if (payload.templateType !== 'quick_create') {
            throw new BadRequestException('只支持 quick_create 模版')
        }

        // 计算新Widget的Y坐标(放在最下面)
        const bottomY = await this.calculateBottomY(payload.dashboardId)

        // 构建查询条件 - 根据事件筛选
        const conditions: any[] = []

        if (payload.eventFilter && payload.eventFilter !== 'all') {
            let eventTypes: string[] = []

            switch (payload.eventFilter) {
                case 'error':
                    eventTypes = ['error', 'exception', 'unhandledrejection']
                    break
                case 'performance':
                    eventTypes = ['performance', 'webVital']
                    break
                case 'user_behavior':
                    eventTypes = ['custom', 'message']
                    break
            }

            if (eventTypes.length > 0) {
                conditions.push({ field: 'event_type', operator: 'IN', value: eventTypes })
            }
        }

        // 根据事件筛选生成图例名称
        let legendName = '全部事件'
        switch (payload.eventFilter) {
            case 'error':
                legendName = '错误相关'
                break
            case 'performance':
                legendName = '性能相关'
                break
            case 'user_behavior':
                legendName = '用户行为'
                break
        }

        // 根据图表类型构建查询和布局
        let fields: string[]
        let groupBy: string[] | undefined
        let orderBy: any[] | undefined
        let layout: { x: number; y: number; w: number; h: number }

        if (payload.widgetType === 'big_number') {
            fields = ['count() as value']
            layout = { x: 0, y: bottomY, w: 3, h: 2 }
        } else {
            // 折线图
            fields = ['toStartOfHour(timestamp) as time', 'count() as value']
            groupBy = ['toStartOfHour(timestamp)']
            orderBy = [{ field: 'toStartOfHour(timestamp)', direction: 'ASC' }]
            layout = { x: 0, y: bottomY, w: 6, h: 4 }
        }

        // 创建Widget
        const widget = new DashboardWidgetEntity({
            dashboardId: payload.dashboardId,
            title: payload.title,
            widgetType: payload.widgetType,
            queries: [
                {
                    id: crypto.randomUUID(),
                    fields,
                    conditions,
                    groupBy,
                    orderBy,
                    legend: legendName,
                    color: '#3b82f6', // 蓝色,与默认图表一致
                },
            ] as any,
            layout: layout as any,
        })

        return await this.widgetRepository.save(widget)
    }
}
