import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { ClickhouseInitService } from '../../fundamentals/clickhouse/clickhouse-init.service'
import { MonitoringHealthService } from './monitoring-health.service'
import { MonitoringService } from './monitoring.service'

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringHealthController {
    constructor(
        private readonly monitoringHealthService: MonitoringHealthService,
        private readonly clickhouseInitService: ClickhouseInitService,
        private readonly monitoringService: MonitoringService
    ) {}

    /**
     * 基础健康检查 - 检查 ClickHouse 连接状态
     */
    @Get('health')
    @ApiOperation({ summary: '基础健康检查' })
    async health() {
        try {
            const isHealthy = await this.clickhouseInitService.healthCheck()
            return {
                success: true,
                database: {
                    clickhouse: {
                        connected: isHealthy,
                    },
                },
                timestamp: new Date().toISOString(),
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
            }
        }
    }

    /**
     * 完整诊断 - 包含数据流验证、最近事件、测试事件等
     */
    @Get('health/diagnostics')
    @ApiOperation({ summary: '完整数据流诊断' })
    async diagnostics() {
        const pipeline = await this.monitoringHealthService.verifyEventPipeline()
        const recentEvents = await this.monitoringHealthService.getRecentEvents(5)
        const testResult = await this.monitoringHealthService.testEventWrite()

        return {
            success: true,
            diagnostics: {
                pipeline,
                recentEvents,
                testEvent: testResult,
            },
            timestamp: new Date().toISOString(),
        }
    }

    /**
     * 获取用户应用列表
     */
    @Get('applications')
    @ApiOperation({ summary: '获取用户应用列表' })
    async getApplications(@Query('userId') userId?: string) {
        if (!userId) {
            return { success: false, data: [], error: 'userId is required' }
        }
        const parsedUserId = parseInt(userId)
        if (isNaN(parsedUserId)) {
            return { success: false, data: [], error: 'userId must be a valid number' }
        }
        return await this.monitoringService.getApplicationsByUserId(parsedUserId)
    }
}
