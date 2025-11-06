import { Controller, ForbiddenException, Get, Query, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ApplicationService } from '../application/application.service'
import { ErrorAggregationService } from './services/error-aggregation.service'
import { ErrorTrendsService } from './services/error-trends.service'

@ApiTags('Error Analytics')
@Controller('error-analytics')
@UseGuards(AuthGuard('jwt'))
export class ErrorAnalyticsController {
    constructor(
        private readonly errorAggregationService: ErrorAggregationService,
        private readonly errorTrendsService: ErrorTrendsService,
        private readonly applicationService: ApplicationService
    ) {}

    private async validateUserOwnsApp(appId: string, userId: number) {
        const apps = await this.applicationService.list({ userId })
        const ownsApp = apps.applications.some(app => app.appId === appId)
        if (!ownsApp) {
            throw new ForbiddenException('You do not own this application')
        }
    }

    @Get('smart-groups')
    @ApiOperation({ summary: '智能错误聚合' })
    @ApiQuery({ name: 'appId', required: true })
    @ApiQuery({ name: 'threshold', required: false, description: '相似度阈值（0-1），默认 0.8' })
    @ApiQuery({ name: 'limit', required: false })
    async getSmartErrorGroups(
        @Query('appId') appId: string,
        @Query('threshold') threshold?: string,
        @Query('limit') limit?: string,
        @Request() req?: any
    ) {
        await this.validateUserOwnsApp(appId, req.user.id)

        const result = await this.errorAggregationService.getSmartErrorGroups({
            appId,
            threshold: threshold ? parseFloat(threshold) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        })

        return {
            success: true,
            data: result,
        }
    }

    @Get('trends')
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
        await this.validateUserOwnsApp(appId, req.user.id)

        if (!window) {
            window = 'hour'
        }

        const result = await this.errorTrendsService.getErrorTrends({
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

    @Get('trends/compare')
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
        await this.validateUserOwnsApp(appId, req.user.id)

        if (!window) {
            window = 'hour'
        }

        const fingerprints = fingerprintsStr
            .split(',')
            .map(f => f.trim())
            .filter(f => f.length > 0)

        if (fingerprints.length === 0) {
            throw new ForbiddenException('At least one fingerprint is required')
        }

        const result = await this.errorTrendsService.compareErrorTrends({
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

    @Get('spike-detection')
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
        await this.validateUserOwnsApp(appId, req.user.id)

        const result = await this.errorTrendsService.detectErrorSpikes({
            appId,
            window: window || 'hour',
            lookback: lookback ? parseInt(lookback, 10) : undefined,
        })

        return {
            success: true,
            data: result,
        }
    }

    @Get('recent-spikes')
    @ApiOperation({ summary: '获取最近的错误突增告警' })
    @ApiQuery({ name: 'appId', required: true })
    @ApiQuery({ name: 'limit', required: false, description: '最大返回数量，默认 10' })
    async getRecentSpikes(@Query('appId') appId: string, @Query('limit') limit?: string, @Request() req?: any) {
        await this.validateUserOwnsApp(appId, req.user.id)

        const result = await this.errorTrendsService.getRecentSpikes(appId, limit ? parseInt(limit, 10) : undefined)

        return {
            success: true,
            data: result,
        }
    }
}
