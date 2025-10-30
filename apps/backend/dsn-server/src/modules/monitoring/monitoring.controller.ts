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
}
