/**
 * 事件相关类型定义
 */

import type { EventType, SourceMapStatus, HttpRequestBody, HttpResponseBody } from './api'

// ==================== 事件相关类型 ====================

/**
 * 监控事件
 */
export interface Event {
    id: string
    app_id: string
    event_type: EventType
    event_data: Record<string, unknown>
    event_name?: string
    timestamp: string
    created_at?: string
    path?: string
    user_agent?: string

    // 错误相关字段
    error_message?: string
    error_stack?: string
    error_lineno?: number
    error_colno?: number
    error_fingerprint?: string

    // 设备信息
    device?: {
        browser?: string
        browserVersion?: string
        os?: string
        osVersion?: string
        type?: string
        screen?: string
    }

    // 网络信息
    network?: {
        type?: string
        rtt?: number
    }

    // 框架信息
    framework?: string
    component_name?: string
    component_stack?: string

    // HTTP 错误详情
    http?: {
        url: string
        method: string
        status: number
        statusText?: string
        duration: number
        requestHeaders?: Record<string, string>
        responseHeaders?: Record<string, string>
        requestBody?: HttpRequestBody
        responseBody?: HttpResponseBody
    }

    // 资源错误详情
    resource?: {
        url: string
        type: string
        tagName?: string
        outerHTML?: string
    }

    // 性能事件字段
    category?: string
    url?: string
    method?: string
    status?: number
    duration?: number
    is_slow?: boolean
    success?: boolean
    value?: number
    metrics?: Record<string, unknown>

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
    user_username?: string
    user_ip?: string

    // 上下文
    tags?: Record<string, unknown>
    extra?: Record<string, unknown>
    breadcrumbs?: Array<{
        timestamp: number
        category: string
        message: string
        level?: string
        data?: Record<string, unknown>
    }>
    contexts?: Record<string, unknown>

    // 事件级别和环境
    event_level?: string
    environment?: string

    // 元数据
    dedup_count?: number
    sampling_rate?: number
    sampling_sampled?: boolean

    // Release (用于 SourceMap 匹配)
    release?: string

    // SourceMap 相关字段
    parsedStack?: string
    originalStack?: string
    sourceMapStatus?: SourceMapStatus

    // Session Replay 相关字段
    replayId?: string

    // 关联错误列表（同一个 replayId 的所有错误）
    relatedErrors?: Array<{
        id: string
        message: string
        timestamp: string
        errorType: 'error' | 'httpError' | 'resourceError' | 'unhandledrejection'
    }>
}

/**
 * 事件统计数据
 * 注意：所有字段都可能为 undefined，因为后端可能返回不完整的数据
 */
export interface EventStats {
    total_events?: number
    error_count?: number
    performance_count?: number
    session_count?: number
    web_vital_count?: number
    http_error_count?: number
    resource_error_count?: number
}
