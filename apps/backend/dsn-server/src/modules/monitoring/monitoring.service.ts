import { InjectQueue } from '@nestjs/bull'
import { ClickHouseClient } from '@clickhouse/client'
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Queue } from 'bull'
import * as pako from 'pako'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

import { ApplicationEntity } from '../../entities/application.entity'
import { EventFieldMapper } from './event-mapper'
import { MonitoringEventDto } from './monitoring.dto'

@Injectable()
export class MonitoringService {
    private readonly logger = new Logger(MonitoringService.name)

    constructor(
        @Inject('CLICKHOUSE_CLIENT') private clickhouseClient: ClickHouseClient,
        @InjectRepository(ApplicationEntity)
        private readonly applicationRepository: Repository<ApplicationEntity>,
        @InjectQueue('sourcemap-parser') private parseQueue: Queue
    ) {}

    private formatTimestamp(date: Date): string {
        const year = date.getUTCFullYear()
        const month = String(date.getUTCMonth() + 1).padStart(2, '0')
        const day = String(date.getUTCDate()).padStart(2, '0')
        const hours = String(date.getUTCHours()).padStart(2, '0')
        const minutes = String(date.getUTCMinutes()).padStart(2, '0')
        const seconds = String(date.getUTCSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }

    /**
     * 接收并处理监控事件
     *
     * @description
     * 核心处理流程：
     * 1. 生成唯一事件 ID
     * 2. 提取并规范化事件数据（错误、性能、用户、设备等）
     * 3. 写入 ClickHouse 数据库
     * 4. 如果是错误事件且包含堆栈信息，自动触发 SourceMap 解析队列
     *
     * @param appId - 应用 ID，用于区分不同应用
     * @param event - 监控事件数据
     * @param userAgent - 用户代理字符串（可选）
     * @returns 成功响应或抛出异常
     */
    async receiveEvent(appId: string, event: MonitoringEventDto, userAgent?: string) {
        try {
            // 特殊处理: Replay 事件 - 路由到 session_replays 表
            if (event.type === 'replay') {
                return await this.receiveSessionReplay(appId, event, userAgent)
            }

            // 特殊处理: Session 事件 - 存储会话统计信息
            if (event.type === 'session') {
                return await this.receiveSessionEvent(appId, event, userAgent)
            }

            // 向后兼容: 旧的 custom + sessionReplay 格式
            if (event.type === 'custom' && event.category === 'sessionReplay' && event.extra?.events) {
                return await this.receiveSessionReplay(
                    appId,
                    {
                        replayId: event.sessionId,
                        events: event.extra.events,
                        metadata: {
                            eventCount: event.extra.eventCount,
                            duration: event.extra.duration,
                        },
                        trigger: 'auto',
                    },
                    userAgent
                )
            }

            const eventId = this.generateEventId()
            const eventData = {
                id: eventId,
                app_id: appId,
                event_type: event.type,
                event_name: event.name || '',
                event_data: JSON.stringify({
                    value: event.value,
                    message: event.message,
                    event: event.event,
                    stack: event.stack,
                    release: event.release,
                    ...event,
                }),
                path: event.path || '',
                user_agent: userAgent || event.userAgent || '',
                timestamp: this.formatTimestamp(new Date()),

                // 错误相关字段
                error_message: event.message || '',
                error_stack: event.stack || '',
                error_lineno: event.lineno || 0,
                error_colno: event.colno || 0,
                error_fingerprint: event.errorFingerprint?.hash || '',

                // 设备信息
                device_browser: event.device?.browser || '',
                device_browser_version: event.device?.browserVersion || '',
                device_os: event.device?.os || '',
                device_os_version: event.device?.osVersion || '',
                device_type: event.device?.deviceType || '',
                device_screen: event.device?.screenResolution || '',

                // 网络信息
                network_type: event.network?.effectiveType || '',
                network_rtt: event.network?.rtt || 0,

                // 框架信息
                framework: event.framework || '',
                component_name: event.vueError?.componentName || event.reactError?.componentName || '',
                component_stack: event.vueError?.componentHierarchy?.join(' > ') || event.reactError?.componentStack || '',

                // HTTP 错误 (支持 HttpErrorIntegration 和 PerformanceIntegration)
                http_url: event.httpError?.url || event.url || '',
                http_method: event.httpError?.method || event.method || '',
                http_status: event.httpError?.status || event.status || 0,
                http_duration: event.httpError?.duration || event.duration || 0,

                // 资源错误
                resource_url: event.resourceError?.url || '',
                resource_type: event.resourceError?.resourceType || '',

                // Session 会话追踪
                session_id: event.sessionId || '',
                session_start_time: event._session?.startTime || 0,
                session_duration: event._session?.duration || 0,
                session_event_count: event._session?.eventCount || 0,
                session_error_count: event._session?.errorCount || 0,
                session_page_views: event._session?.pageViews || 0,

                // User 用户信息
                user_id: event.user?.id || '',
                user_email: event.user?.email || '',
                user_username: event.user?.username || '',
                user_ip: event.user?.ip_address || '',

                // Scope 上下文（JSON 序列化）
                tags: event.tags ? JSON.stringify(event.tags) : '',
                extra: event.extra ? JSON.stringify(event.extra) : '',
                breadcrumbs: event.breadcrumbs ? JSON.stringify(event.breadcrumbs) : '',
                contexts: event.contexts ? JSON.stringify(event.contexts) : '',

                // Event Level & Environment
                event_level: event.level || '',
                environment: event.environment || '',

                // Performance 性能
                perf_category: event.category || '',
                perf_value: typeof event.value === 'number' ? event.value : 0,
                perf_is_slow: event.isSlow ? 1 : 0,
                perf_success: event.success !== false ? 1 : 0,
                perf_metrics: event.metrics ? JSON.stringify(event.metrics) : '',

                // Deduplication 去重
                dedup_count: event._deduplication?.count || 1,

                // Sampling 采样
                sampling_rate: event._sampling?.rate || 1.0,
                sampling_sampled: event._sampling?.sampled !== false ? 1 : 0,
            }

            await this.clickhouseClient.insert({
                table: 'monitor_events',
                values: [eventData],
                format: 'JSONEachRow',
            })

            if (event.stack && event.release && this.isErrorEvent(event.type)) {
                await this.parseQueue.add('parse-stack', {
                    eventId,
                    stack: event.stack,
                    release: event.release,
                    appId,
                })
            }

            return { success: true, message: 'Event recorded' }
        } catch (error) {
            this.logger.error(`Failed to record event: ${error.message}`, error.stack)
            throw error
        }
    }

    private generateEventId(): string {
        return uuidv4()
    }

    /**
     * 判断是否为错误类型事件
     *
     * @description
     * 错误类型包括：
     * - error: JavaScript 运行时错误、资源加载错误、HTTP 错误等
     * - exception: 捕获的异常
     * - unhandledrejection: 未处理的 Promise 拒绝
     *
     * @param type - 事件类型
     * @returns 是否为错误事件
     */
    private isErrorEvent(type: string): boolean {
        return ['error', 'exception', 'unhandledrejection'].includes(type)
    }

    async receiveBatchEvents(appId: string, events: MonitoringEventDto[], userAgent?: string) {
        try {
            // 1. 分离不同类型的事件
            const errorEvents: MonitoringEventDto[] = []
            const replayEvents: MonitoringEventDto[] = []
            const sessionEvents: MonitoringEventDto[] = []
            const otherEvents: MonitoringEventDto[] = []

            for (const event of events) {
                if (this.isErrorEvent(event.type)) {
                    errorEvents.push(event)
                } else if (event.type === 'replay') {
                    replayEvents.push(event)
                } else if (event.type === 'session') {
                    sessionEvents.push(event)
                } else {
                    otherEvents.push(event)
                }
            }

            // 2. 检测 Error + Replay 配对
            const errorReplayPairs = this.findErrorReplayPairs(errorEvents, replayEvents)

            // 3. 处理配对的 Error + Replay（原子性）
            for (const { error, replay } of errorReplayPairs) {
                await this.insertErrorWithReplay(appId, error, replay, userAgent)
            }

            // 4. 处理未配对的错误事件
            const unpairedErrors = errorEvents.filter(error => !errorReplayPairs.some(pair => pair.error === error))
            if (unpairedErrors.length > 0) {
                await this.insertEvents(appId, unpairedErrors, userAgent)
            }

            // 5. 处理未配对的 Replay 事件
            const unpairedReplays = replayEvents.filter(replay => !errorReplayPairs.some(pair => pair.replay === replay))
            for (const replay of unpairedReplays) {
                await this.receiveSessionReplay(appId, replay, userAgent)
            }

            // 6. 处理 Session 事件
            for (const session of sessionEvents) {
                await this.receiveSessionEvent(appId, session, userAgent)
            }

            // 7. 处理其他事件
            if (otherEvents.length > 0) {
                await this.insertEvents(appId, otherEvents, userAgent)
            }

            this.logger.log(
                `Batch events received for app: ${appId}, total: ${events.length}, ` +
                    `errors: ${errorEvents.length}, replays: ${replayEvents.length}, ` +
                    `sessions: ${sessionEvents.length}, others: ${otherEvents.length}, ` +
                    `error-replay pairs: ${errorReplayPairs.length}`
            )

            return { success: true, message: `${events.length} events recorded` }
        } catch (error) {
            this.logger.error(`Failed to record batch events: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 查找 Error 和 Replay 的配对
     */
    private findErrorReplayPairs(
        errors: MonitoringEventDto[],
        replays: MonitoringEventDto[]
    ): Array<{ error: MonitoringEventDto; replay: MonitoringEventDto }> {
        const pairs: Array<{ error: MonitoringEventDto; replay: MonitoringEventDto }> = []

        for (const error of errors) {
            const replayId = (error as any).replayId
            if (replayId) {
                const replay = replays.find((r: any) => r.replayId === replayId)
                if (replay) {
                    pairs.push({ error, replay })
                }
            }
        }

        return pairs
    }

    /**
     * 原子性插入 Error + Replay
     */
    private async insertErrorWithReplay(appId: string, error: MonitoringEventDto, replay: MonitoringEventDto, userAgent?: string) {
        try {
            // 1. 插入错误事件到 monitor_events
            const errorEventId = this.generateEventId()
            // 使用事件自己的 timestamp，如果没有则使用当前时间
            const timestamp = error.timestamp || this.formatTimestamp(new Date())
            const errorData = EventFieldMapper.mapToClickhouse(
                error,
                {
                    app_id: appId,
                    user_agent: userAgent || '',
                    timestamp,
                },
                errorEventId
            )

            await this.clickhouseClient.insert({
                table: 'monitor_events',
                values: [errorData],
                format: 'JSONEachRow',
            })

            // 2. 插入 Replay 到 session_replays，关联 errorEventId
            const replayData = {
                ...replay,
                errorEventId,
            }
            await this.receiveSessionReplay(appId, replayData, userAgent)

            this.logger.log(`Error + Replay pair inserted: errorId=${errorEventId}, replayId=${(replay as any).replayId}`)
        } catch (error) {
            this.logger.error(`Failed to insert error-replay pair: ${error.message}`)
            throw error
        }
    }

    /**
     * 批量插入普通事件
     */
    private async insertEvents(appId: string, events: MonitoringEventDto[], userAgent?: string) {
        const timestamp = this.formatTimestamp(new Date())
        const eventDataList = EventFieldMapper.mapBatchToClickhouse(events, appId, userAgent || '', timestamp, () => this.generateEventId())

        await this.clickhouseClient.insert({
            table: 'monitor_events',
            values: eventDataList,
            format: 'JSONEachRow',
        })
    }

    async getApplicationsByUserId(userId: number) {
        try {
            const [applications, count] = await this.applicationRepository.findAndCount({
                where: { userId },
            })
            return { success: true, data: applications, count }
        } catch (error) {
            this.logger.error(`Failed to get applications for user ${userId}: ${error.message}`, error.stack)
            return { success: false, data: [], count: 0, error: error.message }
        }
    }

    async validateAppId(appId: string): Promise<boolean> {
        try {
            let app = await this.applicationRepository.findOne({
                where: { appId },
            })

            if (!app && appId.startsWith('demo_')) {
                app = await this.applicationRepository.save({
                    appId: appId,
                    name: `Auto-created: ${appId}`,
                    userId: 1,
                })
                this.logger.log(`Auto-created demo application: ${appId}`)
            }

            if (!app) {
                throw new BadRequestException(`Invalid appId: ${appId}. Application not found in database.`)
            }

            this.logger.log(`AppId validated successfully: ${appId}`)
            return true
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error
            }
            this.logger.error(`Failed to validate appId ${appId}: ${error.message}`, error.stack)
            throw new BadRequestException(`Failed to validate appId: ${appId}`)
        }
    }

    /**
     * 接收关键事件（单个）- 立即处理
     */
    async receiveCriticalEvent(appId: string, event: MonitoringEventDto, userAgent?: string) {
        this.logger.warn(`Critical event received for app: ${appId}, type: ${event.type}`)

        // 关键事件立即处理，不走批量
        return await this.receiveEvent(appId, event, userAgent)
    }

    /**
     * 接收关键事件（批量）- 立即处理
     */
    async receiveCriticalEvents(appId: string, events: MonitoringEventDto[], userAgent?: string) {
        this.logger.warn(`Critical events batch received for app: ${appId}, count: ${events.length}`)

        // 关键事件批量也要立即处理
        return await this.receiveBatchEvents(appId, events, userAgent)
    }

    /**
     * 接收 Session 事件
     * 存储会话统计信息到 monitor_events 表
     */
    async receiveSessionEvent(appId: string, event: MonitoringEventDto, userAgent?: string) {
        try {
            const eventId = this.generateEventId()
            // 使用事件自己的 timestamp，如果没有则使用当前时间
            const timestamp = event.timestamp || this.formatTimestamp(new Date())
            const eventData = EventFieldMapper.mapToClickhouse(
                event,
                {
                    app_id: appId,
                    user_agent: userAgent || '',
                    timestamp,
                },
                eventId
            )

            await this.clickhouseClient.insert({
                table: 'monitor_events',
                values: [eventData],
                format: 'JSONEachRow',
            })

            this.logger.log(`Session event received for app: ${appId}, sessionId: ${event.sessionId}`)
            return { success: true, message: 'Session event recorded', eventId }
        } catch (error) {
            this.logger.error(`Failed to record session event: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 接收 Session Replay 数据
     * 新方案：存储到专门的 session_replays 表
     */
    async receiveSessionReplay(appId: string, replayData: any, userAgent?: string) {
        try {
            // 提取 ReplayEvent 字段
            const replayId = replayData.replayId || this.generateEventId()
            const errorEventId = replayData.errorEventId || ''

            // 检测是否压缩
            let replayEvents = replayData.events || []
            let originalSize = 0
            let compressedSize = 0
            let compressed = replayData.metadata?.compressed || false

            if (compressed) {
                // 解压缩数据
                try {
                    const base64String = replayData.events
                    compressedSize = base64String.length

                    // Base64 解码为 Buffer
                    const buffer = Buffer.from(base64String, 'base64')

                    // 转换为 Uint8Array（pako 需要）
                    const uint8Array = new Uint8Array(buffer)

                    // gzip 解压
                    const decompressed = pako.ungzip(uint8Array, { to: 'string' })
                    originalSize = decompressed.length

                    // 解析 JSON
                    replayEvents = JSON.parse(decompressed)

                    // 记录解压缩信息
                    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2)
                    this.logger.log(
                        `[SessionReplay] Decompressed ${compressedSize} bytes → ${originalSize} bytes (${compressionRatio}% reduction)`
                    )
                } catch (error) {
                    this.logger.error(`Failed to decompress session replay data: ${error.message}`)
                    throw error
                }
            } else {
                // 未压缩，直接使用
                originalSize = JSON.stringify(replayEvents).length
            }

            // 将 rrweb 事件数组转换为 JSON 字符串存储
            const eventsJson = JSON.stringify(replayEvents)

            // 插入到 session_replays 表
            // 使用事件自己的 timestamp，如果没有则使用当前时间
            const timestamp = replayData.timestamp || this.formatTimestamp(new Date())
            const replayRecord = {
                id: this.generateEventId(),
                app_id: appId,
                replay_id: replayId,
                error_event_id: errorEventId,
                events: eventsJson,
                event_count: replayData.metadata?.eventCount || replayEvents.length || 0,
                duration: replayData.metadata?.duration || 0,
                compressed: compressed ? 1 : 0,
                original_size: originalSize,
                compressed_size: compressedSize,
                trigger: replayData.trigger || 'manual',
                timestamp,
            }

            await this.clickhouseClient.insert({
                table: 'session_replays',
                values: [replayRecord],
                format: 'JSONEachRow',
            })

            this.logger.log(`Session Replay stored for app: ${appId}, replayId: ${replayId}, events: ${replayRecord.event_count}`)
            return { success: true, message: 'Session Replay received', replayId }
        } catch (error) {
            this.logger.error(`Failed to process Session Replay: ${error.message}`, error.stack)
            throw error
        }
    }
}
