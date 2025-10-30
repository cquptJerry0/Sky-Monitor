import { Controller, ForbiddenException, Get, Param, Query, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'

import { ApplicationService } from '../application/application.service'
import { EventsService } from './events.service'

@ApiTags('Events')
@Controller('events')
@UseGuards(AuthGuard('jwt'))
export class EventsController {
    constructor(
        private readonly eventsService: EventsService,
        private readonly applicationService: ApplicationService
    ) {}

    /**
     * 验证用户是否拥有该应用
     */
    private async validateUserOwnsApp(appId: string, userId: number) {
        const apps = await this.applicationService.list({ userId })
        const ownsApp = apps.applications.some(app => app.appId === appId)
        if (!ownsApp) {
            throw new ForbiddenException('You do not own this application')
        }
    }

    /**
     * 获取事件列表
     * GET /api/events
     */
    @Get()
    @ApiOperation({ summary: '获取监控事件列表' })
    @ApiQuery({ name: 'appId', required: false })
    @ApiQuery({ name: 'eventType', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'offset', required: false })
    async getEvents(
        @Query('appId') appId?: string,
        @Query('eventType') eventType?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
        @Query('startTime') startTime?: string,
        @Query('endTime') endTime?: string,
        @Request() req?: any
    ) {
        // 验证权限：如果指定了 appId，检查用户是否拥有该应用
        if (appId) {
            await this.validateUserOwnsApp(appId, req.user.id)
        }

        const result = await this.eventsService.getEvents({
            appId,
            eventType,
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
            startTime,
            endTime,
        })

        return {
            success: true,
            data: result,
        }
    }

    /**
     * 获取事件详情
     * GET /api/events/:id
     */
    @Get(':id')
    @ApiOperation({ summary: '获取事件详情' })
    async getEventById(@Param('id') id: string) {
        const event = await this.eventsService.getEventById(id)

        return {
            success: true,
            data: event,
        }
    }

    /**
     * 获取统计数据
     * GET /api/events/stats
     */
    @Get('stats/summary')
    @ApiOperation({ summary: '获取监控统计数据' })
    @ApiQuery({ name: 'appId', required: false })
    async getStats(
        @Query('appId') appId?: string,
        @Query('startTime') startTime?: string,
        @Query('endTime') endTime?: string,
        @Request() req?: any
    ) {
        // 验证权限
        if (appId) {
            await this.validateUserOwnsApp(appId, req.user.id)
        }

        const stats = await this.eventsService.getStats({
            appId,
            startTime,
            endTime,
        })

        return {
            success: true,
            data: stats,
        }
    }

    /**
     * 获取应用摘要
     * GET /api/events/app/:appId/summary
     */
    @Get('app/:appId/summary')
    @ApiOperation({ summary: '获取应用事件摘要' })
    async getAppSummary(@Param('appId') appId: string, @Request() req?: any) {
        // 验证权限
        await this.validateUserOwnsApp(appId, req.user.id)

        const summary = await this.eventsService.getAppSummary(appId)

        return {
            success: true,
            data: summary,
        }
    }
}
