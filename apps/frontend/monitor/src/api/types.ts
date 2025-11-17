/**
 * API 类型定义（向后兼容）
 *
 * 说明：
 * - 所有类型已迁移到 @/types 目录
 * - 这个文件保留用于向后兼容，重新导出所有类型
 * - 新代码请直接从 @/types 导入
 */

// 重新导出所有类型，保持向后兼容
export type {
    // API 基础类型
    ApplicationType,
    Application,
    Admin,
    EventUser,
    EventType,
    SourceMapStatus,
    AlertRuleType,
    TimeWindow,
    HttpRequestBody,
    HttpResponseBody,
    PaginatedResponse,
    ApiResponse,
    QueryParams,
    // 事件相关
    Event,
    EventStats,
    // 错误相关
    ErrorTrend,
    SmartErrorGroup,
    Spike,
    // 会话相关
    Session,
    SessionStats,
    SessionReplayData,
    // 性能相关
    SlowRequest,
    WebVital,
    ResourceTiming,
    // 告警相关
    AlertRule,
    AlertHistory,
    // SourceMap 相关
    SourceMapStatusInfo,
    SourceMapProgress,
    // 用户相关
    User,
    ApplicationSummary,
    // Replay 相关
    ReplayData,
    RelatedError,
    ReplayDetail,
} from '@/types'

// ==================== API 响应包装类型（保留在这里，因为是 API 层特有的） ====================

import type { Application } from '@/types'

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
