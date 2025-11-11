import { MonitoringEventDto } from './monitoring.dto'

/**
 * 事件字段映射器
 * 用于优化批量事件处理，减少重复代码
 */
export class EventFieldMapper {
    /**
     * 映射单个事件到 ClickHouse 格式
     */
    static mapToClickhouse(
        event: MonitoringEventDto,
        commonFields: {
            app_id: string
            user_agent: string
            timestamp: string
        },
        eventId: string
    ) {
        return {
            // 基础字段
            id: eventId,
            ...commonFields,
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

            // 错误相关字段
            ...this.mapErrorFields(event),

            // 设备和网络
            ...this.mapDeviceFields(event),
            ...this.mapNetworkFields(event),

            // 框架和组件
            ...this.mapFrameworkFields(event),

            // HTTP 和资源
            ...this.mapHttpFields(event),
            ...this.mapResourceFields(event),

            // Session 和 User
            ...this.mapSessionFields(event),
            ...this.mapUserFields(event),

            // 上下文
            ...this.mapContextFields(event),

            // 性能指标
            ...this.mapPerformanceFields(event),

            // 元数据
            ...this.mapMetadataFields(event),
        }
    }

    private static mapErrorFields(event: MonitoringEventDto) {
        return {
            error_message: event.message || '',
            error_stack: event.stack || '',
            error_lineno: event.lineno || 0,
            error_colno: event.colno || 0,
            error_fingerprint: event.errorFingerprint?.hash || '',
        }
    }

    private static mapDeviceFields(event: MonitoringEventDto) {
        return {
            device_browser: event.device?.browser || '',
            device_browser_version: event.device?.browserVersion || '',
            device_os: event.device?.os || '',
            device_os_version: event.device?.osVersion || '',
            device_type: event.device?.deviceType || '',
            device_screen: event.device?.screenResolution || '',
        }
    }

    private static mapNetworkFields(event: MonitoringEventDto) {
        return {
            network_type: event.network?.effectiveType || '',
            network_rtt: event.network?.rtt || 0,
        }
    }

    private static mapFrameworkFields(event: MonitoringEventDto) {
        return {
            framework: event.framework || '',
            component_name: event.vueError?.componentName || event.reactError?.componentName || '',
            component_stack: event.vueError?.componentHierarchy?.join(' > ') || event.reactError?.componentStack || '',
        }
    }

    private static mapHttpFields(event: MonitoringEventDto) {
        return {
            http_url: event.httpError?.url || '',
            http_method: event.httpError?.method || '',
            http_status: event.httpError?.status || 0,
            http_duration: event.httpError?.duration || 0,
        }
    }

    private static mapResourceFields(event: MonitoringEventDto) {
        return {
            resource_url: event.resourceError?.url || '',
            resource_type: event.resourceError?.resourceType || '',
        }
    }

    private static mapSessionFields(event: MonitoringEventDto) {
        return {
            session_id: event.sessionId || '',
            session_start_time: event._session?.startTime || 0,
            session_duration: event._session?.duration || 0,
            session_event_count: event._session?.eventCount || 0,
            session_error_count: event._session?.errorCount || 0,
            session_page_views: event._session?.pageViews || 0,
        }
    }

    private static mapUserFields(event: MonitoringEventDto) {
        return {
            user_id: event.user?.id || '',
            user_email: event.user?.email || '',
            user_username: event.user?.username || '',
            user_ip: event.user?.ip_address || '',
        }
    }

    private static mapContextFields(event: MonitoringEventDto) {
        return {
            tags: event.tags ? JSON.stringify(event.tags) : '',
            extra: event.extra ? JSON.stringify(event.extra) : '',
            breadcrumbs: event.breadcrumbs ? JSON.stringify(event.breadcrumbs) : '',
            contexts: event.contexts ? JSON.stringify(event.contexts) : '',
            event_level: event.level || '',
            environment: event.environment || '',
        }
    }

    private static mapPerformanceFields(event: MonitoringEventDto) {
        return {
            perf_category: event.category || '',
            perf_value: typeof event.value === 'number' ? event.value : 0,
            perf_is_slow: event.isSlow ? 1 : 0,
            perf_success: event.success !== false ? 1 : 0,
            perf_metrics: event.metrics ? JSON.stringify(event.metrics) : '',
        }
    }

    private static mapMetadataFields(event: MonitoringEventDto) {
        return {
            dedup_count: event._deduplication?.count || 1,
            sampling_rate: event._sampling?.rate || 1.0,
            sampling_sampled: event._sampling?.sampled !== false ? 1 : 0,
        }
    }

    /**
     * 批量映射事件
     */
    static mapBatchToClickhouse(
        events: MonitoringEventDto[],
        appId: string,
        userAgent: string,
        timestamp: string,
        generateId: () => string
    ) {
        const commonFields = {
            app_id: appId,
            user_agent: userAgent,
            timestamp,
        }

        return events.map(event => this.mapToClickhouse(event, commonFields, generateId()))
    }
}
