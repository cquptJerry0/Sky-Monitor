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
    UpdateDashboardDto,
    UpdateWidgetDto,
    UpdateWidgetsLayoutDto,
    createDashboardSchema,
    createWidgetFromTemplateSchema,
    createWidgetSchema,
    deleteDashboardSchema,
    deleteWidgetSchema,
    executeQuerySchema,
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
     * GET /dashboards?appId=xxx (可选)
     */
    @Get()
    async listDashboards(@Request() req, @Query('appId') appId?: string) {
        const dashboards = await this.dashboardService.listDashboards(req.user.id, appId)
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

    /**
     * 恢复默认 Widget
     * POST /dashboards/:dashboardId/reset-widgets
     */
    @Post(':dashboardId/reset-widgets')
    async resetWidgets(@Param('dashboardId') dashboardId: string, @Request() req) {
        const widgets = await this.dashboardService.resetWidgets(dashboardId, req.user.id)
        return { data: widgets, success: true }
    }

    /**
     * 获取Widget模版列表
     * GET /dashboards/templates
     */
    @Get('templates')
    async getTemplates() {
        const templates = await this.dashboardService.getTemplates()
        return { data: templates, success: true }
    }

    /**
     * 从模版创建Widget
     * POST /dashboards/widgets/from-template
     */
    @Post('widgets/from-template')
    @UsePipes(new ZodValidationPipe(createWidgetFromTemplateSchema))
    async createWidgetFromTemplate(@Body() body: CreateWidgetFromTemplateDto, @Request() req) {
        const widget = await this.dashboardService.createWidgetFromTemplate(body, req.user.id)
        return { data: widget, success: true }
    }
}
