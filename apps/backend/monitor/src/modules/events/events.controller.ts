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

    /**
     * 获取智能错误聚合
     * GET /api/events/errors/smart-groups
     *
     * @description
     * 基于错误指纹和消息相似度进行二级聚合，
     * 将相似的错误合并为同一组，减少重复告警。
     */
    @Get('errors/smart-groups')
    @ApiOperation({ summary: '获取智能错误聚合' })
    @ApiQuery({ name: 'appId', required: true })
    @ApiQuery({ name: 'threshold', required: false, description: '相似度阈值(0-1)，默认0.8' })
    @ApiQuery({ name: 'limit', required: false })
    async getSmartErrorGroups(
        @Query('appId') appId: string,
        @Query('threshold') threshold?: string,
        @Query('limit') limit?: string,
        @Request() req?: any
    ) {
        // 验证权限
        await this.validateUserOwnsApp(appId, req.user.id)

        const result = await this.eventsService.getSmartErrorGroups({
            appId,
            threshold: threshold ? parseFloat(threshold) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        })

        return {
            success: true,
            data: result,
        }
    }

    /**
     * 获取错误趋势分析
     * GET /api/events/errors/trends
     *
     * @description
     * 按时间窗口统计错误发生次数，支持小时、天、周三种粒度。
     * 用于识别错误突增时间段、评估修复效果等。
     */
    @Get('errors/trends')
    @ApiOperation({ summary: '获取错误趋势分析' })
    @ApiQuery({ name: 'appId', required: true })
    @ApiQuery({ name: 'fingerprint', required: false, description: '错误指纹，不提供则统计所有错误' })
    @ApiQuery({ name: 'window', required: true, enum: ['hour', 'day', 'week'], description: '时间窗口粒度' })
    @ApiQuery({ name: 'limit', required: false })
    async getErrorTrends(
        @Query('appId') appId: string,
        @Query('fingerprint') fingerprint?: string,
        @Query('window') window?: 'hour' | 'day' | 'week',
        @Query('limit') limit?: string,
        @Request() req?: any
    ) {
        // 验证权限
        await this.validateUserOwnsApp(appId, req.user.id)

        if (!window) {
            window = 'hour' // 默认值
        }

        const result = await this.eventsService.getErrorTrends({
            appId,
            fingerprint,
            window,
            limit: limit ? parseInt(limit, 10) : undefined,
        })

        return {
            success: true,
            data: result,
        }
    }

    /**
     * 对比多个错误的趋势
     * GET /api/events/errors/trends/compare
     *
     * @description
     * 在同一时间轴上对比多个错误指纹的趋势，
     * 用于分析错误之间的相关性和共同触发时间段。
     */
    @Get('errors/trends/compare')
    @ApiOperation({ summary: '对比多个错误的趋势' })
    @ApiQuery({ name: 'appId', required: true })
    @ApiQuery({ name: 'fingerprints', required: true, description: '错误指纹数组，逗号分隔，最多10个' })
    @ApiQuery({ name: 'window', required: true, enum: ['hour', 'day', 'week'] })
    @ApiQuery({ name: 'limit', required: false })
    async compareErrorTrends(
        @Query('appId') appId: string,
        @Query('fingerprints') fingerprintsStr: string,
        @Query('window') window?: 'hour' | 'day' | 'week',
        @Query('limit') limit?: string,
        @Request() req?: any
    ) {
        // 验证权限
        await this.validateUserOwnsApp(appId, req.user.id)

        if (!window) {
            window = 'hour'
        }

        // 解析指纹数组
        const fingerprints = fingerprintsStr
            .split(',')
            .map(f => f.trim())
            .filter(f => f.length > 0)

        if (fingerprints.length === 0) {
            throw new ForbiddenException('At least one fingerprint is required')
        }

        const result = await this.eventsService.compareErrorTrends({
            appId,
            fingerprints,
            window,
            limit: limit ? parseInt(limit, 10) : undefined,
        })

        return {
            success: true,
            data: result,
        }
    }

    /**
     * 检测错误突增
     * GET /api/events/errors/spike-detection
     *
     * @description
     * 通过统计分析检测错误数量的异常突增。
     * 使用平均值 + 2*标准差作为阈值。
     */
    @Get('errors/spike-detection')
    @ApiOperation({ summary: '检测错误突增' })
    @ApiQuery({ name: 'appId', required: true })
    @ApiQuery({ name: 'window', required: false, enum: ['hour', 'day'], description: '时间窗口，默认 hour' })
    @ApiQuery({ name: 'lookback', required: false, description: '回看窗口数量，默认 24' })
    async detectErrorSpikes(
        @Query('appId') appId: string,
        @Query('window') window?: 'hour' | 'day',
        @Query('lookback') lookback?: string,
        @Request() req?: any
    ) {
        // 验证权限
        await this.validateUserOwnsApp(appId, req.user.id)

        const result = await this.eventsService.detectErrorSpikes({
            appId,
            window: window || 'hour',
            lookback: lookback ? parseInt(lookback, 10) : undefined,
        })

        return {
            success: true,
            data: result,
        }
    }

    /**
     * 获取最近的错误突增告警
     * GET /api/events/errors/recent-spikes
     *
     * @description
     * 查询 Redis 中存储的最近错误突增记录，供前端轮询。
     */
    @Get('errors/recent-spikes')
    @ApiOperation({ summary: '获取最近的错误突增告警' })
    @ApiQuery({ name: 'appId', required: true })
    @ApiQuery({ name: 'limit', required: false, description: '最大返回数量，默认 10' })
    async getRecentSpikes(@Query('appId') appId: string, @Query('limit') limit?: string, @Request() req?: any) {
        // 验证权限
        await this.validateUserOwnsApp(appId, req.user.id)

        const result = await this.eventsService.getRecentSpikes(appId, limit ? parseInt(limit, 10) : undefined)

        return {
            success: true,
            data: result,
        }
    }
}
