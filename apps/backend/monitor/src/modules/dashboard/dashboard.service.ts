import { ClickHouseClient } from '@clickhouse/client'
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
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
import { QueryBuilderService } from './query-builder.service'
import { WidgetTemplateService } from './widget-template.service'
import type { TemplateCategory, WidgetTemplateMeta } from './widget-template.types'
import { generateDefaultWidgets } from '../application/default-widgets.config'

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
        private readonly queryBuilderService: QueryBuilderService,
        private readonly widgetTemplateService: WidgetTemplateService
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

    // ==================== Widget 模板相关方法 ====================

    /**
     * 获取所有模板或按分类获取模板
     */
    async getTemplates(category?: TemplateCategory): Promise<{ templates: WidgetTemplateMeta[] }> {
        if (category) {
            const templates = this.widgetTemplateService.getTemplatesByCategory(category)
            return { templates }
        }
        return this.widgetTemplateService.getAllTemplates()
    }

    /**
     * 根据类型获取模板
     */
    async getTemplateByType(type: string): Promise<WidgetTemplateMeta> {
        const template = this.widgetTemplateService.getTemplateByType(type as any)
        return {
            type: template.type,
            name: template.name,
            description: template.description,
            category: template.category,
            widgetType: template.widgetType,
            icon: template.icon,
            editableParams: template.editableParams,
        }
    }

    /**
     * 从模板创建 Widget
     */
    async createWidgetFromTemplate(payload: CreateWidgetFromTemplateDto, userId: number) {
        // 验证 Dashboard 是否存在且属于当前用户
        const dashboard = await this.dashboardRepository.findOne({
            where: { id: payload.dashboardId },
        })

        if (!dashboard) {
            throw new NotFoundException('Dashboard 不存在')
        }

        if (dashboard.userId !== userId) {
            throw new NotFoundException('无权访问此 Dashboard')
        }

        // 验证模板参数
        const validation = this.widgetTemplateService.validateTemplateParams(payload.templateType as any, payload.params)
        if (!validation.valid) {
            throw new BadRequestException(`模板参数验证失败: ${validation.errors.join(', ')}`)
        }

        // 从模板生成查询配置
        const queries = this.widgetTemplateService.generateQueryFromTemplate(payload.templateType as any, payload.params)

        // 获取模板元数据
        const template = this.widgetTemplateService.getTemplateByType(payload.templateType as any)

        // 默认布局配置
        const defaultLayout = { x: 0, y: 0, w: 6, h: 4 }

        // 创建 Widget
        const widget = new DashboardWidgetEntity({
            dashboardId: payload.dashboardId,
            title: template.name,
            widgetType: template.widgetType,
            queries,
            displayConfig: {},
            layout: { ...defaultLayout, ...payload.layout },
        })

        return await this.widgetRepository.save(widget)
    }

    /**
     * 恢复默认 Widget
     * 1. 删除当前 Dashboard 的所有 Widget
     * 2. 重新创建默认的 4 个 Widget
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

        const defaultWidgets = generateDefaultWidgets(dashboardId, dashboard.appId)

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
}
