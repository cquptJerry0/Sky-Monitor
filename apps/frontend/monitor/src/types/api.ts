/**
 * 用户相关
 */
export interface CreateUserPayload {
    username: string
    password: string
}

export interface LoginPayload {
    username: string
    password: string
}

export interface LoginRes {
    data: {
        access_token: string
        refresh_token: string
        expires_in: number
    }
}

export interface CurrentUserRes {
    data: {
        username: string
        email: string
    }
}

/**
 * 应用相关
 */
export type ApplicationType = 'vanilla' | 'react' | 'vue'

export interface ApplicationData {
    type: ApplicationType
    appId: string
    name: string
    bugs: number
    transactions: number
    data: {
        date: string
        resting: number
    }[]
    createdAt: Date
}

/**
 * 应用列表
 */
export interface ApplicationListRes {
    data: { applications: ApplicationData[] }
}

/**
 * 创建应用
 */
export interface CreateApplicationPayload {
    name: string
    type: ApplicationType
}

/**
 * 监控事件相关
 */
export interface MonitorEvent {
    id: string
    app_id: string
    event_type: string
    event_name: string
    event_data: string
    path: string
    user_agent: string
    timestamp: string
    created_at: string
}

export interface EventsListRes {
    data: {
        data: MonitorEvent[]
        total: number
        limit: number
        offset: number
    }
}

export interface EventStatsRes {
    data: {
        eventTypeCounts: Array<{ event_type: string; count: number }>
        errorTrend: Array<{ hour: string; count: number }>
        webVitals: Array<{ event_name: string; avg_value: number; p75_value: number; p95_value: number }>
    }
}

/**
 * Errors Integration
 */
export interface ErrorEvent {
    id: string
    app_id: string
    event_type: 'error'
    event_name: string
    message: string
    stack?: string
    parsedStack?: Array<{
        file: string
        line: number
        column: number
        functionName?: string
        source?: string
    }>
    fingerprint: string
    level: 'error' | 'warning' | 'info'
    timestamp: string
    user_id?: string
    session_id?: string
    deviceInfo?: {
        browser?: string
        os?: string
        device?: string
        screen?: string
    }
    networkInfo?: {
        type?: string
        rtt?: number
    }
    breadcrumbs?: Array<{
        type: string
        category: string
        message: string
        timestamp: string
        data?: any
    }>
}

export interface FetchErrorsParams {
    appId?: string
    fingerprint?: string
    level?: 'error' | 'warning' | 'info'
    startTime?: string
    endTime?: string
    limit?: number
    offset?: number
}

export interface ErrorsListRes {
    success: boolean
    data: {
        data: ErrorEvent[]
        total: number
        limit: number
        offset: number
    }
}

export interface ErrorTrend {
    time_bucket: string
    count: number
    total_occurrences: number
    affected_users: number
    affected_sessions: number
}

export interface ErrorTrendsRes {
    success: boolean
    data: ErrorTrend[]
}

export interface ErrorGroup {
    fingerprint: string
    representative_error: ErrorEvent
    total_count: number
    affected_users: number
    affected_sessions: number
    first_seen: string
    last_seen: string
}

export interface SmartErrorGroupsRes {
    success: boolean
    data: {
        groups: ErrorGroup[]
        original_groups: number
        merged_groups: number
        reduction_rate: number
    }
}

/**
 * Performance Integration
 */
export interface PerformanceEvent {
    id: string
    app_id: string
    event_type: 'performance'
    category: 'http' | 'resourceTiming'
    url: string
    method?: string
    status?: number
    duration: number
    is_slow: boolean
    timestamp: string
    timing?: {
        dns?: number
        tcp?: number
        ttfb?: number
        download?: number
    }
    headers?: Record<string, string>
}

export interface FetchPerformanceParams {
    appId?: string
    category?: 'http' | 'resourceTiming'
    isSlow?: boolean
    startTime?: string
    endTime?: string
    limit?: number
    offset?: number
}

export interface PerformanceListRes {
    success: boolean
    data: {
        data: PerformanceEvent[]
        total: number
        limit: number
        offset: number
    }
}

export interface PerformanceSummary {
    avg_duration: number
    p50_duration: number
    p95_duration: number
    p99_duration: number
    slow_request_rate: number
    failure_rate: number
}

export interface PerformanceSummaryRes {
    success: boolean
    data: PerformanceSummary
}

export interface SlowRequest {
    url: string
    method: string
    avg_duration: number
    p95_duration: number
    count: number
    success_rate: number
}

export interface SlowRequestsRes {
    success: boolean
    data: SlowRequest[]
}

/**
 * Session Integration
 */
export interface SessionEvent {
    id: string
    session_id: string
    app_id: string
    user_id?: string
    start_time: string
    end_time?: string
    duration?: number
    event_count: number
    error_count: number
    page_count: number
    is_active: boolean
    deviceInfo?: {
        browser?: string
        os?: string
        device?: string
    }
}

export interface FetchSessionsParams {
    appId?: string
    startTime?: string
    endTime?: string
    limit?: number
    offset?: number
}

export interface SessionsListRes {
    success: boolean
    data: {
        data: SessionEvent[]
        total: number
        limit: number
        offset: number
    }
}

export interface SessionDetail {
    session: SessionEvent
    events: Array<{
        event_type: string
        event_name: string
        timestamp: string
        data: any
    }>
}

export interface SessionDetailRes {
    success: boolean
    data: SessionDetail
}

export interface SessionStats {
    total_sessions: number
    active_sessions: number
    avg_duration: number
    bounce_rate: number
}

export interface SessionStatsRes {
    success: boolean
    data: SessionStats
}

/**
 * HttpError Integration
 */
export interface HttpErrorEvent {
    id: string
    app_id: string
    http_url: string
    http_method: string
    http_status: number
    http_duration: number
    error_message: string
    timestamp: string
    user_id?: string
    session_id?: string
}

export interface FetchHttpErrorsParams {
    appId?: string
    method?: string
    status?: number
    startTime?: string
    endTime?: string
    limit?: number
    offset?: number
}

export interface HttpErrorsListRes {
    success: boolean
    data: {
        data: HttpErrorEvent[]
        total: number
        limit: number
        offset: number
    }
}

/**
 * ResourceError Integration
 */
export interface ResourceErrorEvent {
    id: string
    app_id: string
    resource_url: string
    resource_type: string
    error_message: string
    timestamp: string
    user_id?: string
    session_id?: string
}

export interface FetchResourceErrorsParams {
    appId?: string
    resourceType?: string
    startTime?: string
    endTime?: string
    limit?: number
    offset?: number
}

export interface ResourceErrorsListRes {
    success: boolean
    data: {
        data: ResourceErrorEvent[]
        total: number
        limit: number
        offset: number
    }
}

/**
 * WebVitals Integration
 */
export interface WebVitalEvent {
    id: string
    app_id: string
    event_name: string
    perf_value: number
    path: string
    timestamp: string
}

export interface FetchWebVitalsParams {
    appId?: string
    metricName?: string
    startTime?: string
    endTime?: string
    limit?: number
    offset?: number
}

export interface WebVitalsListRes {
    success: boolean
    data: {
        data: WebVitalEvent[]
        total: number
        limit: number
        offset: number
    }
}

/**
 * ResourceTiming Integration
 */
export interface ResourceTimingEvent {
    id: string
    app_id: string
    url: string
    type: string
    duration: number
    breakdown: {
        dns: number
        tcp: number
        ssl: number
        ttfb: number
        download: number
    }
    timestamp: string
}

export interface FetchResourceTimingParams {
    appId?: string
    startTime?: string
    endTime?: string
    limit?: number
    offset?: number
}

export interface ResourceTimingListRes {
    success: boolean
    data: {
        data: ResourceTimingEvent[]
        total: number
        limit: number
        offset: number
    }
}

/**
 * Alert Rules
 */
export interface AlertRule {
    id: string
    name: string
    type: 'error_rate' | 'slow_request' | 'session_anomaly'
    threshold: number
    window: string
    enabled: boolean
    created_at: string
}

export interface FetchAlertsParams {
    appId?: string
    type?: string
    limit?: number
    offset?: number
}

export interface AlertsListRes {
    success: boolean
    data: {
        data: AlertRule[]
        total: number
        limit: number
        offset: number
    }
}
