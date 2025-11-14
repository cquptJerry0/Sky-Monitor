/**
 * Session Replay 相关类型定义
 */

import type { EventWithTime } from './rrweb'

// ==================== Replay 相关类型 ====================

/**
 * Replay 数据接口
 */
export interface ReplayData {
    replayId: string
    errorEventId?: string
    /** rrweb 事件数组 */
    events: EventWithTime[]
    metadata: {
        eventCount: number
        duration: number
        compressed: boolean
        originalSize: number
        compressedSize: number
    }
    trigger: 'error' | 'manual' | 'sampled'
    timestamp: string
}

/**
 * 关联错误信息
 */
export interface RelatedError {
    id: string
    message: string
    timestamp: string
    errorType: 'error' | 'httpError' | 'resourceError' | 'unhandledrejection'
    path?: string
    lineno?: number
    colno?: number
}

/**
 * Replay 详情(包含关联错误)
 */
export interface ReplayDetail extends ReplayData {
    relatedErrors: RelatedError[]
}
