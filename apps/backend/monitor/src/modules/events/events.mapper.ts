/**
 * 事件数据映射器
 * 将数据库字段映射为前端期望的格式
 */

interface DatabaseEvent {
    id: string
    app_id: string
    event_type: string
    event_name: string
    event_data: string
    path: string
    user_agent: string
    timestamp: string
    created_at: string

    // 错误字段
    error_message: string
    error_stack: string
    error_lineno: number
    error_colno: number
    error_fingerprint: string

    // 设备信息
    device_browser: string
    device_browser_version: string
    device_os: string
    device_os_version: string
    device_type: string
    device_screen: string

    // 网络信息
    network_type: string
    network_rtt: number

    // 框架信息
    framework: string
    component_name: string
    component_stack: string

    // HTTP 字段
    http_url: string
    http_method: string
    http_status: number
    http_status_text: string
    http_duration: number
    http_request_headers: string
    http_response_headers: string
    http_request_body: string
    http_response_body: string

    // 资源错误
    resource_url: string
    resource_type: string
    resource_tag_name: string
    resource_outer_html: string

    // Session 会话
    session_id: string
    session_start_time: number
    session_duration: number
    session_event_count: number
    session_error_count: number
    session_page_views: number

    // User 用户
    user_id: string
    user_email: string
    user_username: string
    user_ip: string

    // Scope 上下文
    tags: string
    extra: string
    breadcrumbs: string
    contexts: string

    // Event Level
    event_level: string
    environment: string

    // Performance
    perf_category: string
    perf_value: number
    perf_is_slow: number
    perf_success: number
    perf_metrics: string
    perf_rating: string

    // 元数据
    dedup_count: number
    sampling_rate: number
    sampling_sampled: number

    // Release
    release: string
}

/**
 * 映射单个事件
 * 将数据库字段映射为前端友好的格式
 */
export function mapEventForFrontend(event: DatabaseEvent): any {
    // 解析 event_data JSON
    let eventData: any = {}
    try {
        eventData = event.event_data ? JSON.parse(event.event_data) : {}
    } catch {
        eventData = {}
    }

    const mapped: any = {
        // 基础字段
        id: event.id,
        app_id: event.app_id,
        event_type: event.event_type,
        event_name: event.event_name,
        event_data: event.event_data,
        path: event.path,
        user_agent: event.user_agent,
        timestamp: event.timestamp,
        created_at: event.created_at,

        // 错误字段
        error_message: event.error_message,
        error_stack: event.error_stack,
        error_lineno: event.error_lineno,
        error_colno: event.error_colno,
        error_fingerprint: event.error_fingerprint,

        // SourceMap 解析后的堆栈 (从 event_data 中提取)
        parsedStack: eventData.parsedStack || null,
        originalStack: eventData.originalStack || null,

        // 设备信息（组合为对象）
        device: {
            browser: event.device_browser,
            browserVersion: event.device_browser_version,
            os: event.device_os,
            osVersion: event.device_os_version,
            type: event.device_type,
            screen: event.device_screen,
        },

        // 网络信息（组合为对象）
        network: {
            type: event.network_type,
            rtt: event.network_rtt,
        },

        // 框架信息
        framework: event.framework,
        component_name: event.component_name,
        component_stack: event.component_stack,

        // Session
        session_id: event.session_id,
        session_start_time: event.session_start_time,
        session_duration: event.session_duration,
        session_event_count: event.session_event_count,
        session_error_count: event.session_error_count,
        session_page_views: event.session_page_views,

        // User
        user_id: event.user_id,
        user_email: event.user_email,
        user_username: event.user_username,
        user_ip: event.user_ip,

        // Scope 上下文（解析 JSON）
        tags: event.tags ? parseJsonSafe(event.tags) : null,
        extra: event.extra ? parseJsonSafe(event.extra) : null,
        breadcrumbs: event.breadcrumbs ? parseJsonSafe(event.breadcrumbs) : null,
        contexts: event.contexts ? parseJsonSafe(event.contexts) : null,

        // Event Level
        event_level: event.event_level,
        environment: event.environment,

        // 元数据
        dedup_count: event.dedup_count,
        sampling_rate: event.sampling_rate,
        sampling_sampled: event.sampling_sampled === 1,

        // Release
        release: event.release,
    }

    // 根据事件类型添加特定字段
    if (event.event_type === 'performance' && event.perf_category === 'http') {
        // PerformanceIntegration: 映射 HTTP 字段到顶层（前端期望格式）
        mapped.category = event.perf_category
        mapped.url = event.http_url
        mapped.method = event.http_method
        mapped.status = event.http_status
        mapped.duration = event.http_duration
        mapped.is_slow = event.perf_is_slow === 1
        mapped.success = event.perf_success === 1
        mapped.metrics = event.perf_metrics ? parseJsonSafe(event.perf_metrics) : null
    } else if (event.event_type === 'performance') {
        // 其他 performance 事件
        mapped.category = event.perf_category
        mapped.value = event.perf_value
        mapped.metrics = event.perf_metrics ? parseJsonSafe(event.perf_metrics) : null
    } else if (event.event_type === 'error' && event.http_url) {
        // HttpErrorIntegration: HTTP 错误
        mapped.http = {
            url: event.http_url,
            method: event.http_method,
            status: event.http_status,
            statusText: event.http_status_text,
            duration: event.http_duration,
            requestHeaders: event.http_request_headers ? parseJsonSafe(event.http_request_headers) : null,
            responseHeaders: event.http_response_headers ? parseJsonSafe(event.http_response_headers) : null,
            requestBody: event.http_request_body ? parseJsonSafe(event.http_request_body) : null,
            responseBody: event.http_response_body ? parseJsonSafe(event.http_response_body) : null,
        }
    } else if (event.event_type === 'error' && event.resource_url) {
        // ResourceErrorIntegration: 资源错误
        mapped.resource = {
            url: event.resource_url,
            type: event.resource_type,
            tagName: event.resource_tag_name,
            outerHTML: event.resource_outer_html,
        }
    } else if (event.event_type === 'webVital') {
        // Metrics Integration: Web Vitals
        mapped.value = event.perf_value
        mapped.perf_value = event.perf_value
        mapped.perf_rating = event.perf_rating
    }

    return mapped
}

/**
 * 批量映射事件
 */
export function mapEventsForFrontend(events: DatabaseEvent[]): any[] {
    return events.map(mapEventForFrontend)
}

/**
 * 安全解析 JSON
 */
function parseJsonSafe(jsonString: string): any {
    try {
        return JSON.parse(jsonString)
    } catch {
        return null
    }
}
