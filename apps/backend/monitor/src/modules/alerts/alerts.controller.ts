import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards, ForbiddenException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'

import { ApplicationService } from '../application/application.service'
import { AlertsService } from './alerts.service'
import { CreateAlertRuleDto, UpdateAlertRuleDto } from './alerts.dto'

@ApiTags('Alerts')
@Controller('alerts')
@UseGuards(AuthGuard('jwt'))
export class AlertsController {
    constructor(
        private readonly alertsService: AlertsService,
        private readonly applicationService: ApplicationService
    ) {}

    private async validateUserOwnsApp(appId: string, userId: number) {
        const apps = await this.applicationService.list({ userId })
        const ownsApp = apps.applications.some(app => app.appId === appId)
        if (!ownsApp) {
            throw new ForbiddenException('You do not own this application')
        }
    }

    @Get('rules')
    @ApiOperation({ summary: '获取告警规则列表' })
    @ApiQuery({ name: 'appId', required: false })
    @ApiQuery({ name: 'type', required: false })
    async getRules(@Query('appId') appId?: string, @Query('type') type?: string, @Request() req?: any) {
        if (appId) {
            await this.validateUserOwnsApp(appId, req.user.id)
        }

        const rules = await this.alertsService.getRules({ appId, type, userId: req.user.id })

        return {
            success: true,
            data: rules,
        }
    }

    @Get('rules/:id')
    @ApiOperation({ summary: '获取告警规则详情' })
    async getRuleById(@Param('id') id: string, @Request() req?: any) {
        const rule = await this.alertsService.getRuleById(id)

        if (rule) {
            await this.validateUserOwnsApp(rule.app_id, req.user.id)
        }

        return {
            success: true,
            data: rule,
        }
    }

    @Post('rules')
    @ApiOperation({ summary: '创建告警规则' })
    async createRule(@Body() dto: CreateAlertRuleDto, @Request() req?: any) {
        await this.validateUserOwnsApp(dto.app_id, req.user.id)

        const rule = await this.alertsService.createRule({
            ...dto,
            user_id: req.user.id,
        })

        return {
            success: true,
            data: rule,
        }
    }

    @Put('rules/:id')
    @ApiOperation({ summary: '更新告警规则' })
    async updateRule(@Param('id') id: string, @Body() dto: UpdateAlertRuleDto, @Request() req?: any) {
        const existingRule = await this.alertsService.getRuleById(id)
        if (existingRule) {
            await this.validateUserOwnsApp(existingRule.app_id, req.user.id)
        }

        const rule = await this.alertsService.updateRule(id, dto)

        return {
            success: true,
            data: rule,
        }
    }

    @Delete('rules/:id')
    @ApiOperation({ summary: '删除告警规则' })
    async deleteRule(@Param('id') id: string, @Request() req?: any) {
        const existingRule = await this.alertsService.getRuleById(id)
        if (existingRule) {
            await this.validateUserOwnsApp(existingRule.app_id, req.user.id)
        }

        await this.alertsService.deleteRule(id)

        return {
            success: true,
            message: 'Alert rule deleted successfully',
        }
    }

    @Get('history')
    @ApiOperation({ summary: '获取告警历史' })
    @ApiQuery({ name: 'appId', required: false })
    @ApiQuery({ name: 'ruleId', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getHistory(
        @Query('appId') appId?: string,
        @Query('ruleId') ruleId?: string,
        @Query('limit') limit?: string,
        @Request() req?: any
    ) {
        if (appId) {
            await this.validateUserOwnsApp(appId, req.user.id)
        }

        const history = await this.alertsService.getHistory({
            appId,
            ruleId,
            limit: limit ? parseInt(limit, 10) : 100,
        })

        return {
            success: true,
            data: history,
        }
    }
}
