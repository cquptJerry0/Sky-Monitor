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
     * 批量查询 SourceMap 解析状态
     * POST /api/events/sourcemap/status
     *
     * @description
     * 用于前端批量查询多个事件的 SourceMap 解析状态。
     * 常用于错误列表页显示解析进度。
     */
    @Get('sourcemap/status')
    @ApiOperation({ summary: '批量查询 SourceMap 解析状态' })
    @ApiQuery({ name: 'eventIds', required: true, description: '事件 ID 列表（逗号分隔，最多 100 个）' })
    async getSourceMapStatuses(@Query('eventIds') eventIdsStr: string) {
        const eventIds = eventIdsStr
            .split(',')
            .map(id => id.trim())
            .filter(id => id.length > 0)

        if (eventIds.length === 0) {
            return {
                success: true,
                data: {},
            }
        }

        const statuses = await this.eventsService.getSourceMapStatuses({ eventIds })

        return {
            success: true,
            data: statuses,
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

    /**
     * 获取会话列表
     * GET /api/events/sessions
     */
    @Get('sessions/list')
    @ApiOperation({ summary: '获取会话列表' })
    @ApiQuery({ name: 'appId', required: true })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'offset', required: false })
    async getSessions(
        @Query('appId') appId: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
        @Request() req?: any
    ) {
        // 验证权限
        await this.validateUserOwnsApp(appId, req.user.id)

        const result = await this.eventsService.getSessions({
            appId,
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
        })

        return {
            success: true,
            data: result,
        }
    }

    /**
     * 获取会话统计数据
     * GET /api/events/sessions/stats
     */
    @Get('sessions/stats')
    @ApiOperation({ summary: '获取会话统计数据' })
    @ApiQuery({ name: 'appId', required: true })
    @ApiQuery({ name: 'timeWindow', required: false, description: '时间窗口: hour, day, week，默认 day' })
    async getSessionStats(@Query('appId') appId: string, @Query('timeWindow') timeWindow?: 'hour' | 'day' | 'week', @Request() req?: any) {
        // 验证权限
        await this.validateUserOwnsApp(appId, req.user.id)

        const stats = await this.eventsService.getSessionStats({
            appId,
            timeWindow: timeWindow || 'day',
        })

        return {
            success: true,
            data: stats,
        }
    }

    /**
     * 获取会话回放数据
     * GET /api/events/sessions/:sessionId/replay
     */
    @Get('sessions/:sessionId/replay')
    @ApiOperation({ summary: '获取会话回放数据' })
    async getSessionReplay(@Param('sessionId') sessionId: string, @Query('appId') appId: string, @Request() req?: any) {
        // 验证权限
        if (appId) {
            await this.validateUserOwnsApp(appId, req.user.id)
        }

        const result = await this.eventsService.getSessionReplay(sessionId)

        return {
            success: true,
            data: result,
        }
    }

    /**
     * 按会话ID查询事件
     * GET /api/events/sessions/:sessionId
     */
    @Get('sessions/:sessionId')
    @ApiOperation({ summary: '按会话ID查询事件' })
    async getEventsBySession(@Param('sessionId') sessionId: string, @Query('appId') appId: string, @Request() req?: any) {
        // 验证权限
        if (appId) {
            await this.validateUserOwnsApp(appId, req.user.id)
        }

        const result = await this.eventsService.getEventsBySession(sessionId)

        return {
            success: true,
            data: result,
        }
    }

    /**
     * 获取慢请求列表
     * GET /api/events/performance/slow-requests
     */
    @Get('performance/slow-requests')
    @ApiOperation({ summary: '获取慢请求列表' })
    @ApiQuery({ name: 'appId', required: true })
    @ApiQuery({ name: 'threshold', required: false, description: '慢请求阈值(ms)，默认3000' })
    @ApiQuery({ name: 'limit', required: false })
    async getSlowRequests(
        @Query('appId') appId: string,
        @Query('threshold') threshold?: string,
        @Query('limit') limit?: string,
        @Request() req?: any
    ) {
        // 验证权限
        await this.validateUserOwnsApp(appId, req.user.id)

        const result = await this.eventsService.getSlowRequests({
            appId,
            threshold: threshold ? parseInt(threshold, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        })

        return {
            success: true,
            data: result,
        }
    }

    /**
     * 获取错误聚合（按指纹分组）
     * GET /api/events/errors/groups
     */
    @Get('errors/groups')
    @ApiOperation({ summary: '获取错误聚合（按指纹分组）' })
    @ApiQuery({ name: 'appId', required: true })
    @ApiQuery({ name: 'limit', required: false })
    async getErrorGroups(@Query('appId') appId: string, @Query('limit') limit?: string, @Request() req?: any) {
        // 验证权限
        await this.validateUserOwnsApp(appId, req.user.id)

        const result = await this.eventsService.getErrorGroups({
            appId,
            limit: limit ? parseInt(limit, 10) : undefined,
        })

        return {
            success: true,
            data: result,
        }
    }

    /**
     * 按用户查询事件
     * GET /api/events/users/:userId
     */
    @Get('users/:userId')
    @ApiOperation({ summary: '按用户查询事件' })
    @ApiQuery({ name: 'appId', required: true })
    @ApiQuery({ name: 'limit', required: false })
    async getUserEvents(
        @Param('userId') userId: string,
        @Query('appId') appId: string,
        @Query('limit') limit?: string,
        @Request() req?: any
    ) {
        // 验证权限
        await this.validateUserOwnsApp(appId, req.user.id)

        const result = await this.eventsService.getUserEvents({
            userId,
            appId,
            limit: limit ? parseInt(limit, 10) : undefined,
        })

        return {
            success: true,
            data: result,
        }
    }

    /**
     * 获取采样率统计
     * GET /api/events/stats/sampling
     */
    @Get('stats/sampling')
    @ApiOperation({ summary: '获取采样率统计' })
    @ApiQuery({ name: 'appId', required: true })
    async getSamplingStats(@Query('appId') appId: string, @Request() req?: any) {
        // 验证权限
        await this.validateUserOwnsApp(appId, req.user.id)

        const result = await this.eventsService.getSamplingStats(appId)

        return {
            success: true,
            data: result,
        }
    }
}
