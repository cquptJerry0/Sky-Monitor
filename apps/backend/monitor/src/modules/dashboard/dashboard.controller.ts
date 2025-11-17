import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards, UsePipes } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe'
import {
    CreateDashboardDto,
    CreateWidgetDto,
    CreateWidgetFromTemplateDto,
    DeleteDashboardDto,
    DeleteWidgetDto,
    ExecuteQueryDto,
    GetTemplatesQueryDto,
    UpdateDashboardDto,
    UpdateWidgetDto,
    UpdateWidgetsLayoutDto,
    createDashboardSchema,
    createWidgetFromTemplateSchema,
    createWidgetSchema,
    deleteDashboardSchema,
    deleteWidgetSchema,
    executeQuerySchema,
    getTemplatesQuerySchema,
    updateDashboardSchema,
    updateWidgetSchema,
    updateWidgetsLayoutSchema,
} from './dashboard.dto'
import { DashboardService } from './dashboard.service'

@Controller('dashboards')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    /**
     * 创建 Dashboard
     * POST /dashboards
     */
    @Post()
    @UsePipes(new ZodValidationPipe(createDashboardSchema))
    async createDashboard(@Body() body: CreateDashboardDto, @Request() req) {
        const dashboard = await this.dashboardService.createDashboard(body, req.user.id)
        return { data: dashboard, success: true }
    }

    /**
     * 获取用户的所有 Dashboard
     * GET /dashboards
     */
    @Get()
    async listDashboards(@Request() req) {
        const dashboards = await this.dashboardService.listDashboards(req.user.id)
        return { data: dashboards, success: true }
    }

    /**
     * 获取 Dashboard 详情 (包含所有 Widget)
     * GET /dashboards/:id
     */
    @Get(':id')
    async getDashboard(@Param('id') id: string, @Request() req) {
        const dashboard = await this.dashboardService.getDashboard(id, req.user.id)
        return { data: dashboard, success: true }
    }

    /**
     * 更新 Dashboard
     * PUT /dashboards
     */
    @Put()
    @UsePipes(new ZodValidationPipe(updateDashboardSchema))
    async updateDashboard(@Body() body: UpdateDashboardDto, @Request() req) {
        const dashboard = await this.dashboardService.updateDashboard(body, req.user.id)
        return { data: dashboard, success: true }
    }

    /**
     * 删除 Dashboard
     * DELETE /dashboards
     */
    @Delete()
    @UsePipes(new ZodValidationPipe(deleteDashboardSchema))
    async deleteDashboard(@Body() body: DeleteDashboardDto, @Request() req) {
        const affected = await this.dashboardService.deleteDashboard(body, req.user.id)
        return { data: { affected }, success: true }
    }

    /**
     * 创建 Widget
     * POST /dashboards/widgets
     */
    @Post('widgets')
    @UsePipes(new ZodValidationPipe(createWidgetSchema))
    async createWidget(@Body() body: CreateWidgetDto, @Request() req) {
        const widget = await this.dashboardService.createWidget(body, req.user.id)
        return { data: widget, success: true }
    }

    /**
     * 更新 Widget
     * PUT /dashboards/widgets
     */
    @Put('widgets')
    @UsePipes(new ZodValidationPipe(updateWidgetSchema))
    async updateWidget(@Body() body: UpdateWidgetDto, @Request() req) {
        const widget = await this.dashboardService.updateWidget(body, req.user.id)
        return { data: widget, success: true }
    }

    /**
     * 删除 Widget
     * DELETE /dashboards/widgets
     */
    @Delete('widgets')
    @UsePipes(new ZodValidationPipe(deleteWidgetSchema))
    async deleteWidget(@Body() body: DeleteWidgetDto, @Request() req) {
        const affected = await this.dashboardService.deleteWidget(body, req.user.id)
        return { data: { affected }, success: true }
    }

    /**
     * 批量更新 Widget 布局 (拖拽后保存)
     * PUT /dashboards/widgets/layout
     */
    @Put('widgets/layout')
    @UsePipes(new ZodValidationPipe(updateWidgetsLayoutSchema))
    async updateWidgetsLayout(@Body() body: UpdateWidgetsLayoutDto, @Request() req) {
        const result = await this.dashboardService.updateWidgetsLayout(body, req.user.id)
        return { data: result, success: true }
    }

    /**
     * 执行查询
     * POST /dashboards/widgets/query
     */
    @Post('widgets/query')
    @UsePipes(new ZodValidationPipe(executeQuerySchema))
    async executeQuery(@Body() body: ExecuteQueryDto, @Request() req) {
        const result = await this.dashboardService.executeQuery(body, req.user.id)
        return { data: result, success: true }
    }

    // ==================== Widget 模板相关 API ====================

    /**
     * 获取所有 Widget 模板
     * GET /dashboards/templates
     */
    @Get('templates')
    @UsePipes(new ZodValidationPipe(getTemplatesQuerySchema))
    async getTemplates(@Query() query: GetTemplatesQueryDto) {
        const templates = await this.dashboardService.getTemplates(query.category)
        return { data: templates, success: true }
    }

    /**
     * 获取单个 Widget 模板
     * GET /dashboards/templates/:type
     */
    @Get('templates/:type')
    async getTemplateByType(@Param('type') type: string) {
        const template = await this.dashboardService.getTemplateByType(type)
        return { data: template, success: true }
    }

    /**
     * 从模板创建 Widget
     * POST /dashboards/widgets/from-template
     */
    @Post('widgets/from-template')
    @UsePipes(new ZodValidationPipe(createWidgetFromTemplateSchema))
    async createWidgetFromTemplate(@Body() body: CreateWidgetFromTemplateDto, @Request() req) {
        const widget = await this.dashboardService.createWidgetFromTemplate(body, req.user.id)
        return { data: widget, success: true }
    }
}
