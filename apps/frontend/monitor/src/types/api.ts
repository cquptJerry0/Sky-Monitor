/**
 * API 相关类型定义
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
    /** 应用访问地址 */
    url?: string
    /** 创建时间 */
    createdAt: string
    /** 更新时间 */
    updatedAt: string | null
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

/**
 * 事件用户信息
 * 对应后端: monitor_events 表的用户字段
 * 注意: 这是SDK通过setUser()设置的用户信息,不是管理员用户
 */
export interface EventUser {
    /** 用户 ID */
    id: string
    /** 用户邮箱 */
    email: string
    /** 用户名 */
    username: string
}

// ==================== 枚举类型 ====================

/**
 * 事件类型枚举 (一级分类)
 * 对应后端: MonitoringEventDto.type
 * 注意: 二级分类使用 event_name 字段
 */
export type EventType =
    | 'error' // 错误事件(一级)
    | 'unhandledrejection' // Promise拒绝(已废弃,统一为error)
    | 'performance' // 性能事件(一级)
    | 'webVital' // Web Vitals(一级)
    | 'session' // 会话统计
    | 'message' // 日志消息
    | 'custom' // 自定义事件
    // 向后兼容
    | 'httpError'
    | 'resourceError'
    | 'event'

/**
 * 事件名称 (二级分类)
 * 对应后端: MonitoringEventDto.name
 * 用于在同一 type 下进一步区分事件子类型
 */
export type EventName =
    // 错误子类型
    | 'runtime_error' // JS运行时错误
    | 'http_error' // HTTP请求错误
    | 'resource_error' // 资源加载错误
    | 'unhandled_rejection' // Promise拒绝
    // 性能子类型
    | 'http_performance' // HTTP性能
    | 'resource_timing' // 资源性能
    // Web Vitals子类型
    | 'LCP' // Largest Contentful Paint
    | 'FCP' // First Contentful Paint
    | 'CLS' // Cumulative Layout Shift
    | 'TTFB' // Time to First Byte
    | 'FID' // First Input Delay
    | 'INP' // Interaction to Next Paint

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

// ==================== HTTP 相关类型 ====================

/**
 * HTTP 请求体类型（用于替代 any）
 * 可以是 JSON 对象、FormData、字符串等
 */
export type HttpRequestBody = Record<string, unknown> | FormData | string | null

/**
 * HTTP 响应体类型（用于替代 any）
 * 通常是 JSON 对象或字符串
 */
export type HttpResponseBody = Record<string, unknown> | string | null

// ==================== 通用类型 ====================

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page?: number
    pageSize?: number
}

/**
 * API 标准响应包装
 */
export interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
}

/**
 * 查询参数（用于 URL 构建）
 */
export type QueryParams = Record<string, string | number | boolean | null | undefined>
