import { InjectQueue } from '@nestjs/bull'
import { ClickHouseClient } from '@clickhouse/client'
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Queue } from 'bull'
import { Repository } from 'typeorm'

import { ApplicationEntity } from '../../entities/application.entity'
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

                // HTTP 错误
                http_url: event.httpError?.url || '',
                http_method: event.httpError?.method || '',
                http_status: event.httpError?.status || 0,
                http_duration: event.httpError?.duration || 0,

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
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    private isErrorEvent(type: string): boolean {
        return ['error', 'exception', 'unhandledrejection'].includes(type)
    }

    async receiveBatchEvents(appId: string, events: MonitoringEventDto[], userAgent?: string) {
        try {
            const now = new Date()
            const eventDataList = events.map(event => ({
                app_id: appId,
                event_type: event.type,
                event_name: event.name || '',
                event_data: JSON.stringify({
                    value: event.value,
                    message: event.message,
                    event: event.event,
                    ...event,
                }),
                path: event.path || '',
                user_agent: userAgent || event.userAgent || '',
                timestamp: this.formatTimestamp(now),

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

                // HTTP 错误
                http_url: event.httpError?.url || '',
                http_method: event.httpError?.method || '',
                http_status: event.httpError?.status || 0,
                http_duration: event.httpError?.duration || 0,

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
            }))

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
            const app = await this.applicationRepository.findOne({
                where: { appId },
            })

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
}
