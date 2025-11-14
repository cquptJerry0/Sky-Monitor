/**
 * 类型统一导出
 *
 * 说明：
 * - 所有领域类型集中在 types 目录下
 * - 组件局部类型保留在组件文件内
 * - 按功能模块拆分类型文件，避免单文件过大
 */

// ==================== API 基础类型 ====================
export type {
    ApplicationType,
    Application,
    Admin,
    EventType,
    SourceMapStatus,
    AlertRuleType,
    TimeWindow,
    HttpRequestBody,
    HttpResponseBody,
    PaginatedResponse,
    ApiResponse,
    QueryParams,
} from './api'

// ==================== 事件相关类型 ====================
export type { Event, EventStats } from './event'

// ==================== 错误相关类型 ====================
export type { ErrorTrend, SmartErrorGroup, Spike } from './error'

// ==================== 会话相关类型 ====================
export type { Session, SessionStats, SessionReplayData } from './session'

// ==================== 性能相关类型 ====================
export type { SlowRequest, WebVital, ResourceTiming } from './performance'

// ==================== 告警相关类型 ====================
export type { AlertRule, AlertHistory } from './alert'

// ==================== SourceMap 相关类型 ====================
export type { SourceMapStatusInfo, SourceMapProgress } from './sourcemap'

// ==================== 用户相关类型 ====================
export type { User, ApplicationSummary } from './user'

// ==================== Replay 相关类型 ====================
export type { ReplayData, RelatedError, ReplayDetail } from './replay'

// ==================== RRWeb 相关类型 ====================
export type { EventWithTime, RRWebPlayerInstance, RRWebPlayerConfig, PlayerEventPayload } from './rrweb'

// ==================== Dashboard 相关类型 ====================
export type {
    WidgetType,
    QueryCondition,
    QueryConfig,
    YAxisConfig,
    DisplayConfig,
    LayoutConfig,
    Dashboard,
    DashboardWidget,
    CreateDashboardDto,
    UpdateDashboardDto,
    DeleteDashboardDto,
    CreateWidgetDto,
    UpdateWidgetDto,
    DeleteWidgetDto,
    UpdateWidgetsLayoutDto,
    ExecuteQueryDto,
    QueryResultDataPoint,
    QueryResult,
    ExecuteQueryResponse,
} from './dashboard'

// ==================== Chart 相关类型 ====================
export type { ChartDataPoint, ChartPayload } from './rrweb'
