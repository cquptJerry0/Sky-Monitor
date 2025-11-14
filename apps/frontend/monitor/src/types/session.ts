/**
 * 会话相关类型定义
 */

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
