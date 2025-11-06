import { Controller, Query, Sse, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { interval, map, Observable } from 'rxjs'
import { ErrorTrendsService } from './services/error-trends.service'

@ApiTags('Error Analytics Stream')
@Controller('error-analytics')
@UseGuards(AuthGuard('jwt'))
export class ErrorAnalyticsStreamController {
    constructor(private readonly errorTrendsService: ErrorTrendsService) {}

    /**
     * SSE: 错误突增告警推送
     * GET /api/error-analytics/stream/spikes?appId=xxx
     */
    @Sse('stream/spikes')
    @ApiOperation({ summary: '错误突增告警实时推送（SSE）' })
    @ApiQuery({ name: 'appId', required: true })
    streamErrorSpikes(@Query('appId') appId: string): Observable<MessageEvent> {
        return interval(5000).pipe(
            map(async () => {
                const spikes = await this.errorTrendsService.getRecentSpikes(appId, 1)

                if (spikes.spikes && spikes.spikes.length > 0) {
                    const spike = spikes.spikes[0]
                    return {
                        data: JSON.stringify(spike),
                        id: Date.now().toString(),
                        type: 'spike',
                        retry: 10000,
                    }
                }

                return {
                    data: JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }),
                    type: 'heartbeat',
                    retry: 10000,
                }
            })
        )
    }

    /**
     * SSE: 错误趋势实时更新
     * GET /api/error-analytics/stream/trends?appId=xxx&fingerprint=xxx
     */
    @Sse('stream/trends')
    @ApiOperation({ summary: '错误趋势实时更新（SSE）' })
    @ApiQuery({ name: 'appId', required: true })
    @ApiQuery({ name: 'fingerprint', required: false })
    streamErrorTrends(@Query('appId') appId: string, @Query('fingerprint') fingerprint?: string): Observable<MessageEvent> {
        return interval(10000).pipe(
            map(async () => {
                const trends = await this.errorTrendsService.getErrorTrends({
                    appId,
                    fingerprint,
                    window: 'hour',
                    limit: 24,
                })

                return {
                    data: JSON.stringify(trends),
                    id: Date.now().toString(),
                    type: 'trend_update',
                    retry: 10000,
                }
            })
        )
    }
}
