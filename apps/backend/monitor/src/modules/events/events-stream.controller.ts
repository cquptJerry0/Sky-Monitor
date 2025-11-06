import { Controller, Query, Sse, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { interval, map, Observable } from 'rxjs'
import { EventsService } from './events.service'

@ApiTags('Events Stream')
@Controller('events')
@UseGuards(AuthGuard('jwt'))
export class EventsStreamController {
    constructor(private readonly eventsService: EventsService) {}

    /**
     * SSE: 通用事件流（支持按类型过滤）
     * GET /api/events/stream/events?appId=xxx&type=error
     */
    @Sse('stream/events')
    @ApiOperation({ summary: '通用事件流（SSE）' })
    @ApiQuery({ name: 'appId', required: true })
    @ApiQuery({ name: 'type', required: false, enum: ['error', 'performance', 'webVital', 'message', 'transaction', 'custom'] })
    streamEvents(
        @Query('appId') appId: string,
        @Query('type') type?: 'error' | 'performance' | 'webVital' | 'message' | 'transaction' | 'custom'
    ): Observable<MessageEvent> {
        return interval(2000).pipe(
            map(async () => {
                const events = await this.eventsService.getEvents({
                    appId,
                    eventType: type,
                    limit: 10,
                })

                return {
                    data: JSON.stringify(events),
                    id: Date.now().toString(),
                    type: 'events',
                    retry: 10000,
                }
            })
        )
    }

    /**
     * SSE: 错误事件流
     * GET /api/events/stream/errors?appId=xxx
     */
    @Sse('stream/errors')
    @ApiOperation({ summary: '错误事件流（SSE）' })
    @ApiQuery({ name: 'appId', required: true })
    streamErrors(@Query('appId') appId: string): Observable<MessageEvent> {
        return interval(2000).pipe(
            map(async () => {
                const events = await this.eventsService.getEvents({
                    appId,
                    eventType: 'error',
                    limit: 10,
                })

                return {
                    data: JSON.stringify(events),
                    id: Date.now().toString(),
                    type: 'error_events',
                    retry: 10000,
                }
            })
        )
    }

    /**
     * SSE: 性能事件流
     * GET /api/events/stream/performance?appId=xxx
     */
    @Sse('stream/performance')
    @ApiOperation({ summary: '性能事件流（SSE）' })
    @ApiQuery({ name: 'appId', required: true })
    streamPerformance(@Query('appId') appId: string): Observable<MessageEvent> {
        return interval(5000).pipe(
            map(async () => {
                const events = await this.eventsService.getEvents({
                    appId,
                    eventType: 'performance',
                    limit: 10,
                })

                return {
                    data: JSON.stringify(events),
                    id: Date.now().toString(),
                    type: 'performance_events',
                    retry: 10000,
                }
            })
        )
    }

    /**
     * SSE: Web Vitals 实时指标
     * GET /api/events/stream/web-vitals?appId=xxx
     */
    @Sse('stream/web-vitals')
    @ApiOperation({ summary: 'Web Vitals 实时指标（SSE）' })
    @ApiQuery({ name: 'appId', required: true })
    streamWebVitals(@Query('appId') appId: string): Observable<MessageEvent> {
        return interval(10000).pipe(
            map(async () => {
                const events = await this.eventsService.getEvents({
                    appId,
                    eventType: 'webVital',
                    limit: 20,
                })

                return {
                    data: JSON.stringify(events),
                    id: Date.now().toString(),
                    type: 'web_vitals',
                    retry: 10000,
                }
            })
        )
    }

    /**
     * SSE: 实时统计数据
     * GET /api/events/stream/stats?appId=xxx
     */
    @Sse('stream/stats')
    @ApiOperation({ summary: '实时统计数据（SSE）' })
    @ApiQuery({ name: 'appId', required: true })
    streamStats(@Query('appId') appId: string): Observable<MessageEvent> {
        return interval(5000).pipe(
            map(async () => {
                const stats = await this.eventsService.getStats(appId)

                return {
                    data: JSON.stringify(stats),
                    id: Date.now().toString(),
                    type: 'stats',
                    retry: 10000,
                }
            })
        )
    }

    /**
     * SSE: SourceMap 解析进度
     * GET /api/events/stream/sourcemap-progress?eventId=xxx
     */
    @Sse('stream/sourcemap-progress')
    @ApiOperation({ summary: 'SourceMap 解析进度（SSE）' })
    @ApiQuery({ name: 'eventId', required: true })
    streamSourceMapProgress(@Query('eventId') eventId: string): Observable<MessageEvent> {
        return interval(1000).pipe(
            map(async () => {
                const event = await this.eventsService.getEventById(eventId)

                const sourceMapStatus = (event as any).sourceMapStatus || 'not_available'

                return {
                    data: JSON.stringify({
                        eventId,
                        status: sourceMapStatus,
                        timestamp: Date.now(),
                    }),
                    id: Date.now().toString(),
                    type: 'sourcemap_progress',
                    retry: 10000,
                }
            })
        )
    }
}
