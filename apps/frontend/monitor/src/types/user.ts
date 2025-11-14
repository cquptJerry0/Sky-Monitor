/**
 * 用户相关类型定义
 */

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
