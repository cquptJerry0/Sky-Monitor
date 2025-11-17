import { Controller, Query, Sse, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { interval, switchMap, Observable, finalize } from 'rxjs'
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
    ): Observable<any> {
        return interval(2000).pipe(
            switchMap(async () => {
                try {
                    const events = await this.eventsService.getEvents({
                        appId,
                        eventType: type,
                        limit: 10,
                    })

                    // 如果没有数据，发送心跳
                    if (!events.data || events.data.length === 0) {
                        return {
                            data: JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }),
                            type: 'heartbeat',
                            retry: 10000,
                        }
                    }

                    return {
                        data: JSON.stringify(events),
                        id: Date.now().toString(),
                        type: 'events',
                        retry: 10000,
                    }
                } catch (error) {
                    console.error(`[SSE] Error fetching events for appId ${appId}:`, error)
                    // 错误时发送心跳，保持连接
                    return {
                        data: JSON.stringify({ type: 'heartbeat', timestamp: Date.now(), error: true }),
                        type: 'heartbeat',
                        retry: 10000,
                    }
                }
            }),
            finalize(() => {})
        )
    }

    /**
     * SSE: 错误事件流
     * GET /api/events/stream/errors?appId=xxx
     */
    @Sse('stream/errors')
    @ApiOperation({ summary: '错误事件流（SSE）' })
    @ApiQuery({ name: 'appId', required: true })
    streamErrors(@Query('appId') appId: string): Observable<any> {
        return interval(2000).pipe(
            switchMap(async () => {
                try {
                    const events = await this.eventsService.getEvents({
                        appId,
                        eventType: 'error',
                        limit: 10,
                    })

                    if (!events.data || events.data.length === 0) {
                        return {
                            data: JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }),
                            type: 'heartbeat',
                            retry: 10000,
                        }
                    }

                    return {
                        data: JSON.stringify(events),
                        id: Date.now().toString(),
                        type: 'error_events',
                        retry: 10000,
                    }
                } catch (error) {
                    console.error(`[SSE] Error fetching error events for appId ${appId}:`, error)
                    return {
                        data: JSON.stringify({ type: 'heartbeat', timestamp: Date.now(), error: true }),
                        type: 'heartbeat',
                        retry: 10000,
                    }
                }
            }),
            finalize(() => {})
        )
    }

    /**
     * SSE: 性能事件流
     * GET /api/events/stream/performance?appId=xxx
     */
    @Sse('stream/performance')
    @ApiOperation({ summary: '性能事件流（SSE）' })
    @ApiQuery({ name: 'appId', required: true })
    streamPerformance(@Query('appId') appId: string): Observable<any> {
        return interval(5000).pipe(
            switchMap(async () => {
                try {
                    const events = await this.eventsService.getEvents({
                        appId,
                        eventType: 'performance',
                        limit: 10,
                    })

                    if (!events.data || events.data.length === 0) {
                        return {
                            data: JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }),
                            type: 'heartbeat',
                            retry: 10000,
                        }
                    }

                    return {
                        data: JSON.stringify(events),
                        id: Date.now().toString(),
                        type: 'performance_events',
                        retry: 10000,
                    }
                } catch (error) {
                    console.error(`[SSE] Error fetching performance events for appId ${appId}:`, error)
                    return {
                        data: JSON.stringify({ type: 'heartbeat', timestamp: Date.now(), error: true }),
                        type: 'heartbeat',
                        retry: 10000,
                    }
                }
            }),
            finalize(() => {})
        )
    }

    /**
     * SSE: Web Vitals 实时指标
     * GET /api/events/stream/web-vitals?appId=xxx
     */
    @Sse('stream/web-vitals')
    @ApiOperation({ summary: 'Web Vitals 实时指标（SSE）' })
    @ApiQuery({ name: 'appId', required: true })
    streamWebVitals(@Query('appId') appId: string): Observable<any> {
        return interval(10000).pipe(
            switchMap(async () => {
                try {
                    const events = await this.eventsService.getEvents({
                        appId,
                        eventType: 'webVital',
                        limit: 20,
                    })

                    if (!events.data || events.data.length === 0) {
                        return {
                            data: JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }),
                            type: 'heartbeat',
                            retry: 10000,
                        }
                    }

                    return {
                        data: JSON.stringify(events),
                        id: Date.now().toString(),
                        type: 'web_vitals',
                        retry: 10000,
                    }
                } catch (error) {
                    console.error(`[SSE] Error fetching web vitals for appId ${appId}:`, error)
                    return {
                        data: JSON.stringify({ type: 'heartbeat', timestamp: Date.now(), error: true }),
                        type: 'heartbeat',
                        retry: 10000,
                    }
                }
            }),
            finalize(() => {})
        )
    }

    /**
     * SSE: 实时统计数据
     * GET /api/events/stream/stats?appId=xxx
     */
    @Sse('stream/stats')
    @ApiOperation({ summary: '实时统计数据（SSE）' })
    @ApiQuery({ name: 'appId', required: true })
    streamStats(@Query('appId') appId: string): Observable<any> {
        return interval(5000).pipe(
            switchMap(async () => {
                try {
                    const stats = await this.eventsService.getStats({ appId })

                    return {
                        data: JSON.stringify(stats),
                        id: Date.now().toString(),
                        type: 'stats',
                        retry: 10000,
                    }
                } catch (error) {
                    console.error(`[SSE] Error fetching stats for appId ${appId}:`, error)
                    return {
                        data: JSON.stringify({ type: 'heartbeat', timestamp: Date.now(), error: true }),
                        type: 'heartbeat',
                        retry: 10000,
                    }
                }
            }),
            finalize(() => {})
        )
    }

    /**
     * SSE: SourceMap 解析进度
     * GET /api/events/stream/sourcemap-progress?eventId=xxx
     */
    @Sse('stream/sourcemap-progress')
    @ApiOperation({ summary: 'SourceMap 解析进度（SSE）' })
    @ApiQuery({ name: 'eventId', required: true })
    streamSourceMapProgress(@Query('eventId') eventId: string): Observable<any> {
        return interval(1000).pipe(
            switchMap(async () => {
                try {
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
                } catch (error) {
                    console.error(`[SSE] Error fetching sourcemap progress for eventId ${eventId}:`, error)
                    return {
                        data: JSON.stringify({
                            eventId,
                            status: 'error',
                            timestamp: Date.now(),
                        }),
                        type: 'sourcemap_progress',
                        retry: 10000,
                    }
                }
            }),
            finalize(() => {})
        )
    }
}
