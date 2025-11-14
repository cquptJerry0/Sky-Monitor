/**
 * 错误相关类型定义
 */

// ==================== 错误相关类型 ====================

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
