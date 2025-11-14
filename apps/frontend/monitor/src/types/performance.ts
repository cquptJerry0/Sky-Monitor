/**
 * 性能相关类型定义
 */

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
