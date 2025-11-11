import { InjectQueue } from '@nestjs/bull'
import { ClickHouseClient } from '@clickhouse/client'
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Queue } from 'bull'
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

            this.logger.log(`Event received for app: ${appId}, type: ${event.type}`)

            /**
             * 自动触发 SourceMap 解析
             *
             * @description
             * 当满足以下条件时，将错误堆栈加入解析队列：
             * 1. 事件包含堆栈信息（stack）
             * 2. 事件包含版本信息（release），用于匹配对应版本的 SourceMap
             * 3. 事件类型为错误相关（error, exception, unhandledrejection）
             *
             * 解析过程：
             * - 使用 Bull Queue 异步处理，不阻塞事件上报
             * - SourceMapProcessor 从数据库获取对应的 SourceMap 文件
             * - StackParserService 使用 source-map 库还原源码位置
             * - 解析结果更新回事件记录
             */
            if (event.stack && event.release && this.isErrorEvent(event.type)) {
                await this.parseQueue.add('parse-stack', {
                    eventId,
                    stack: event.stack,
                    release: event.release,
                    appId,
                })
                this.logger.log(`Stack parsing queued for event: ${eventId}`)
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
            // 使用优化的映射器，提取公共字段
            const timestamp = this.formatTimestamp(new Date())
            const eventDataList = EventFieldMapper.mapBatchToClickhouse(events, appId, userAgent || '', timestamp, () =>
                this.generateEventId()
            )

            await this.clickhouseClient.insert({
                table: 'monitor_events',
                values: eventDataList,
                format: 'JSONEachRow',
            })

            this.logger.log(`Batch events received for app: ${appId}, count: ${events.length}`)

            return { success: true, message: `${events.length} events recorded` }
        } catch (error) {
            this.logger.error(`Failed to record batch events: ${error.message}`, error.stack)
            throw error
        }
    }

    async getApplicationsByUserId(userId: number) {
        try {
            const [applications, count] = await this.applicationRepository.findAndCount({
                where: { userId },
            })
            this.logger.log(`Fetched ${applications.length} applications for user: ${userId}`)
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
                    appName: `Auto-created: ${appId}`,
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
     * 接收 Session Replay 数据
     * 特殊处理：存储到对象存储，数据库只存元数据
     */
    async receiveSessionReplay(appId: string, replayData: any, userAgent?: string) {
        try {
            const sessionId = replayData.sessionId || this.generateEventId()

            // TODO: 实际项目应该存储到 S3/OSS
            // const s3Url = await this.uploadToS3(replayData)

            // 存储元数据到 ClickHouse
            const metadata = {
                id: this.generateEventId(),
                app_id: appId,
                event_type: 'sessionReplay',
                event_name: 'Session Replay',
                event_data: JSON.stringify({
                    sessionId,
                    eventCount: replayData.events?.length || 0,
                    duration: replayData.metadata?.duration || 0,
                    trigger: replayData.trigger || 'manual',
                    // s3Url, // 实际的存储地址
                }),
                path: replayData.path || '',
                user_agent: userAgent || '',
                timestamp: this.formatTimestamp(new Date()),

                // Session 相关字段
                session_id: sessionId,
                session_event_count: replayData.events?.length || 0,

                // 其他字段使用默认值
                error_message: '',
                error_stack: '',
                error_lineno: 0,
                error_colno: 0,
                error_fingerprint: '',
                device_browser: '',
                device_browser_version: '',
                device_os: '',
                device_os_version: '',
                device_type: '',
                device_screen: '',
                network_type: '',
                network_rtt: 0,
                framework: '',
                component_name: '',
                component_stack: '',
                http_url: '',
                http_method: '',
                http_status: 0,
                http_duration: 0,
                resource_url: '',
                resource_type: '',
                session_start_time: 0,
                session_duration: replayData.metadata?.duration || 0,
                session_error_count: 0,
                session_page_views: 0,
                user_id: '',
                user_email: '',
                user_username: '',
                user_ip: '',
                tags: '',
                extra: JSON.stringify(replayData.metadata || {}),
                breadcrumbs: '',
                contexts: '',
                event_level: 'info',
                environment: '',
                perf_category: 'sessionReplay',
                perf_value: 0,
                perf_is_slow: 0,
                perf_success: 1,
                perf_metrics: '',
                dedup_count: 1,
                sampling_rate: 1.0,
                sampling_sampled: 1,
            }

            await this.clickhouseClient.insert({
                table: 'monitor_events',
                values: [metadata],
                format: 'JSONEachRow',
            })

            this.logger.log(`Session Replay metadata stored for app: ${appId}, session: ${sessionId}`)
            return { success: true, message: 'Session Replay received', sessionId }
        } catch (error) {
            this.logger.error(`Failed to process Session Replay: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 接收辅助数据（延迟处理）
     */
    async receiveAuxiliaryEvents(appId: string, events: MonitoringEventDto[], userAgent?: string) {
        try {
            // 辅助数据可以放入队列延迟处理
            // TODO: 实现队列处理机制
            // await this.auxiliaryQueue.add('process-auxiliary', {
            //     appId,
            //     events,
            //     userAgent,
            //     timestamp: Date.now()
            // })

            // 临时：直接处理
            this.logger.log(`Auxiliary events received for app: ${appId}, count: ${events.length}`)
            return await this.receiveBatchEvents(appId, events, userAgent)
        } catch (error) {
            this.logger.error(`Failed to queue auxiliary events: ${error.message}`, error.stack)
            throw error
        }
    }
}
