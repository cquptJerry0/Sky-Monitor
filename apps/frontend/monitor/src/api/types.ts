/**
 * API 类型定义
 *
 * 说明：
 * - 所有类型手动维护，与后端 Entity 保持一致
 * - 后端使用 Zod 验证，未使用 @ApiProperty 装饰器
 * - 不使用自动生成的 OpenAPI 类型
 */

// ==================== 核心实体类型（对应后端 Entity） ====================

/**
 * 应用类型枚举
 * 对应后端: ApplicationEntity.type
 * 数据库: ENUM('vanilla', 'react', 'vue')
 */
export type ApplicationType = 'vanilla' | 'react' | 'vue'

/**
 * 应用实体
 * 对应后端: ApplicationEntity
 * 数据库表: application
 */
export interface Application {
    /** 主键 */
    id: number
    /** 应用 ID (例如: react123456) */
    appId: string
    /** 应用类型 */
    type: ApplicationType
    /** 应用名称 */
    name: string
    /** 应用描述 */
    description: string | null
    /** 创建时间 */
    createdAt: string
    /** 更新时间 */
    updatedA5t: string | null
    /** 用户 ID */
    userId: number
}

/**
 * 管理员实体
 * 对应后端: AdminEntity
 * 数据库表: admin
 */
export interface Admin {
    /** 主键 */
    id: number
    /** 用户名 */
    username: string
    /** 邮箱 */
    email: string | null
    /** 创建时间 */
    createdAt: string
    /** 更新时间 */
    updatedAt: string | null
}

// ==================== 枚举类型 ====================

/**
 * 事件类型枚举
 * 对应后端: MonitoringEventDto.type
 */
export type EventType =
    | 'error'
    | 'unhandledrejection'
    | 'httpError'
    | 'resourceError'
    | 'webVital'
    | 'performance'
    | 'session'
    | 'message'
    | 'event'
    | 'custom'

/**
 * SourceMap 解析状态
 */
export type SourceMapStatus = 'parsed' | 'parsing' | 'not_available' | 'failed'

/**
 * 告警规则类型
 */
export type AlertRuleType = 'error_rate' | 'slow_request' | 'session_anomaly'

/**
 * 时间窗口
 */
export type TimeWindow = 'hour' | 'day' | 'week'

// ==================== 事件相关类型 ====================

/**
 * 监控事件
 */
export interface Event {
    id: string
    app_id: string
    event_type: EventType
    event_data: string | Record<string, unknown>
    timestamp: string

    // 错误相关字段
    error_message?: string
    error_stack?: string
    error_fingerprint?: string
    error_type?: string

    // 性能相关字段
    performance_metric?: string
    performance_value?: number

    // Web Vitals 相关字段
    web_vital_name?: string
    web_vital_value?: number
    web_vital_rating?: 'good' | 'needs-improvement' | 'poor'

    // 会话相关字段
    session_id?: string
    session_start_time?: number
    session_duration?: number
    session_event_count?: number
    session_error_count?: number
    session_page_views?: number

    // 用户相关字段
    user_id?: string
    user_email?: string
    user_name?: string

    // 环境信息
    browser?: string
    browser_version?: string
    os?: string
    os_version?: string
    device_type?: string
    url?: string

    // SourceMap 相关字段
    parsedStack?: string
    originalStack?: string
    sourceMapStatus?: SourceMapStatus

    // 采样相关
    sample_rate?: number
    is_sampled?: boolean

    created_at?: string
}

/**
 * 事件统计数据
 */
export interface EventStats {
    total_events: number
    error_count: number
    performance_count: number
    session_count: number
    web_vital_count?: number
    http_error_count?: number
    resource_error_count?: number
}

/**
 * 错误趋势数据
 */
export interface ErrorTrend {
    time_bucket: string
    count: number
    total_occurrences: number
    unique_users?: number
}

/**
 * 智能错误分组
 */
export interface SmartErrorGroup {
    fingerprint: string
    error_message: string
    error_type: string
    count: number
    affected_users: number
    first_seen: string
    last_seen: string
    similarity_score?: number
    stack_trace_sample?: string
}

/**
 * 错误突增检测
 */
export interface Spike {
    fingerprint: string
    error_message: string
    current_count: number
    baseline_count: number
    increase_rate: number
    detected_at: string
    severity: 'low' | 'medium' | 'high' | 'critical'
}

// ==================== 会话相关类型 ====================

/**
 * 会话信息
 */
export interface Session {
    session_id: string
    app_id: string
    start_time: number
    duration: number
    event_count: number
    error_count: number
    page_views: number

    user_id?: string
    user_email?: string
    user_name?: string

    browser?: string
    os?: string
    device_type?: string

    first_url?: string
    last_url?: string

    created_at?: string
}

/**
 * 会话统计数据
 */
export interface SessionStats {
    total_sessions: number
    active_sessions: number
    avg_duration: number
    bounce_rate: number
    avg_page_views?: number
    avg_errors?: number
}

/**
 * 会话回放数据
 */
export interface SessionReplayData {
    events: Record<string, unknown>[] // rrweb 事件数组
    metadata: {
        sessionId: string
        eventCount: number
        duration: number
        size: number
        timestamp: string
    }
}

// ==================== 应用相关类型 ====================

/**
 * 应用摘要
 */
export interface ApplicationSummary {
    appId: string
    total_events: number
    error_count: number
    session_count: number
    last_event_time?: string
}

// ==================== 告警相关类型 ====================

/**
 * 告警规则
 */
export interface AlertRule {
    id: string
    app_id: string
    name: string
    type: AlertRuleType
    threshold: number
    window: string
    enabled: boolean
    notification_channels?: string[]
    created_at?: string
    updated_at?: string
}

/**
 * 告警历史
 */
export interface AlertHistory {
    id: string
    rule_id: string
    rule_name: string
    app_id: string
    triggered_at: string
    threshold: number
    actual_value: number
    severity: 'low' | 'medium' | 'high' | 'critical'
    resolved: boolean
    resolved_at?: string
}

// ==================== 性能相关类型 ====================

/**
 * 慢请求
 */
export interface SlowRequest {
    id: string
    app_id: string
    url: string
    method: string
    duration: number
    timestamp: string
    status_code?: number
    user_id?: string
}

/**
 * Web Vitals 指标
 */
export interface WebVital {
    id: string
    app_id: string
    name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP'
    value: number
    rating: 'good' | 'needs-improvement' | 'poor'
    timestamp: string
    url?: string
    user_id?: string
}

/**
 * 资源时序
 */
export interface ResourceTiming {
    id: string
    app_id: string
    resource_url: string
    resource_type: string
    duration: number
    size?: number
    timestamp: string
}

// ==================== SourceMap 相关类型 ====================

/**
 * SourceMap 解析状态
 */
export interface SourceMapStatusInfo {
    eventId: string
    status: SourceMapStatus
    hasParsedStack: boolean
    error?: string
}

/**
 * SourceMap 解析进度（SSE）
 */
export interface SourceMapProgress {
    eventId: string
    status: SourceMapStatus
    timestamp: number
}

// ==================== 用户相关类型 ====================

/**
 * 用户信息
 */
export interface User {
    id: number
    username: string
    email?: string
    role?: 'admin' | 'user'
    created_at?: string
}

// ==================== API 响应包装类型 ====================

/**
 * 应用列表响应
 */
export interface ApplicationListResponse {
    success: boolean
    data: {
        applications: Application[]
        count: number
    }
    message?: string
    error?: string
}

/**
 * 单个应用响应
 */
export interface ApplicationResponse {
    success: boolean
    data: Application
    message?: string
    error?: string
}

/**
 * 删除响应
 */
export interface DeleteResponse {
    success: boolean
    data: null
    message?: string
    error?: string
}
