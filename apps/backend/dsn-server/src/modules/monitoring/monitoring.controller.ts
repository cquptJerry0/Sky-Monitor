import { Body, Controller, Headers, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'

import { MonitoringEventDto } from './monitoring.dto'
import { MonitoringService } from './monitoring.service'

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
    constructor(private readonly monitoringService: MonitoringService) {}

    /**
     * 接收单个监控事件
     * POST /api/monitoring/:appId
     */
    @Post(':appId')
    @ApiOperation({ summary: '接收SDK上报的监控数据' })
    @ApiParam({ name: 'appId', description: '应用ID' })
    async receiveEvent(@Param('appId') appId: string, @Body() event: MonitoringEventDto, @Headers('user-agent') userAgent?: string) {
        // 验证appId
        await this.monitoringService.validateAppId(appId)

        // 记录事件
        return await this.monitoringService.receiveEvent(appId, event, userAgent)
    }

    /**
     * 批量接收监控事件
     * POST /api/monitoring/:appId/batch
     */
    @Post(':appId/batch')
    @ApiOperation({ summary: '批量接收SDK上报的监控数据' })
    @ApiParam({ name: 'appId', description: '应用ID' })
    async receiveBatchEvents(
        @Param('appId') appId: string,
        @Body() events: MonitoringEventDto[],
        @Headers('user-agent') userAgent?: string
    ) {
        // 验证appId
        await this.monitoringService.validateAppId(appId)

        // 批量记录事件
        return await this.monitoringService.receiveBatchEvents(appId, events, userAgent)
    }

    /**
     * 接收关键事件（错误、异常等）- 立即处理
     * POST /api/monitoring/:appId/critical
     */
    @Post(':appId/critical')
    @ApiOperation({ summary: '接收关键事件（错误、异常等）' })
    @ApiParam({ name: 'appId', description: '应用ID' })
    async receiveCriticalEvent(
        @Param('appId') appId: string,
        @Body() event: MonitoringEventDto | { type: string; events: MonitoringEventDto[] },
        @Headers('user-agent') userAgent?: string
    ) {
        await this.monitoringService.validateAppId(appId)

        // 判断是单个事件还是批量（来自批量传输的最小批量）
        if ('events' in event && Array.isArray(event.events)) {
            return await this.monitoringService.receiveCriticalEvents(appId, event.events, userAgent)
        } else {
            return await this.monitoringService.receiveCriticalEvent(appId, event as MonitoringEventDto, userAgent)
        }
    }

    /**
     * 接收 Session Replay 数据 - 特殊处理大数据
     * POST /api/monitoring/:appId/replay
     */
    @Post(':appId/replay')
    @ApiOperation({ summary: '接收 Session Replay 录制数据' })
    @ApiParam({ name: 'appId', description: '应用ID' })
    async receiveSessionReplay(@Param('appId') appId: string, @Body() replayData: any, @Headers('user-agent') userAgent?: string) {
        await this.monitoringService.validateAppId(appId)

        // Session Replay 需要特殊处理（压缩、存储到 S3 等）
        return await this.monitoringService.receiveSessionReplay(appId, replayData, userAgent)
    }
}
