/**
 * SourceMap 相关类型定义
 */

import type { SourceMapStatus } from './api'

// ==================== SourceMap 相关类型 ====================

/**
 * SourceMap 解析状态信息
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
