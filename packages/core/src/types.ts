import { Transport } from './transport'

/**
 * 事件级别
 */
export type EventLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal'

/**
 * 事件类型
 */
export type EventType = 'error' | 'message' | 'performance' | 'webVital' | 'transaction' | 'custom'

/**
 * 基础事件接口
 * 所有事件的通用字段
 */
export interface BaseEvent {
    type: EventType
    timestamp?: string
    level?: EventLevel
    release?: string
    environment?: string
    /**
     * 应用 ID，用于后端识别应用和匹配 SourceMap
     */
    appId?: string
    tags?: Record<string, string>
    extra?: Record<string, unknown>
    user?: User
    breadcrumbs?: Breadcrumb[]
    contexts?: Record<string, Record<string, unknown> | null>
    sessionId?: string
    // 集成元数据（可选）
    _deduplication?: {
        fingerprint: string
        count: number
    }
    _sampling?: {
        rate: number
        sampled: boolean
        timestamp: number
    }
    _session?: {
        startTime: number
        duration: number
        eventCount: number
        errorCount: number
        pageViews: number
    }
}

/**
 * 错误事件
 */
export interface ErrorEvent extends BaseEvent {
    type: 'error'
    message: string
    stack?: string
    error?: Error
    exception?: {
        type?: string
        value?: string
        stacktrace?: string
    }
}

/**
 * 性能事件（Web Vitals 等）
 */
export interface PerformanceEvent extends BaseEvent {
    type: 'performance' | 'webVital'
    name?: string
    value?: number
    metrics?: Record<string, number>
    duration?: number
    path?: string
    // HTTP 性能相关字段
    category?: string
    url?: string
    method?: string
    status?: number
    isSlow?: boolean
    success?: boolean
    error?: string
}

/**
 * 消息事件
 */
export interface MessageEvent extends BaseEvent {
    type: 'message'
    message: string
}

/**
 * 事务事件（用于追踪完整的用户操作）
 */
export interface TransactionEvent extends BaseEvent {
    type: 'transaction'
    name: string
    op: string
    status?: string
    startTimestamp?: number
    endTimestamp?: number
    spans?: Array<{
        spanId: string
        parentSpanId?: string
        op: string
        description?: string
        startTimestamp: number
        endTimestamp: number
    }>
}

/**
 * 自定义事件（向后兼容）
 */
export interface CustomEvent extends BaseEvent {
    type: 'custom'
    [key: string]: unknown
}

/**
 * 监控事件联合类型
 * 使用判别联合（discriminated unions）提供类型安全
 */
export type MonitoringEvent = ErrorEvent | PerformanceEvent | MessageEvent | TransactionEvent | CustomEvent

/**
 * Integration interface
 * 集成接口
 * 基于插件化设计
 */
export interface Integration {
    name: string

    /**
     * 优先级：数值越小优先级越高
     * 默认为 50
     * 例如：Deduplication 可以设置为 10，确保最先执行
     */
    priority?: number

    // 全局初始化，仅执行一次（注册全局监听器）
    setupOnce?(): void

    // 每次SDK初始化时调用（接收transport）
    // 支持异步操作
    init?(transport: Transport): void | Promise<void>

    // 事件发送前处理钩子（修改/过滤事件）
    beforeSend?(event: MonitoringEvent): MonitoringEvent | null | Promise<MonitoringEvent | null>

    // 清理资源（取消监听器、清理定时器等）
    // 在客户端关闭时调用
    cleanup?(): void | Promise<void>
}

/**
 * Monitoring options
 * 监控相关配置
 */
export interface MonitoringOptions {
    dsn: string
    integrations: Integration[]
    release?: string
    /**
     * 应用 ID，用于区分不同应用
     * 如果不提供，将从 DSN 中提取
     */
    appId?: string
    /**
     * 环境标识（如 production, staging, development）
     */
    environment?: string
    /**
     * 是否启用 SourceMap 解析功能
     * 开启后，错误堆栈将在后端自动解析为源码位置
     * @default false
     */
    enableSourceMap?: boolean
}

/**
 * 类型守卫：检查是否为错误事件
 */
export function isErrorEvent(event: MonitoringEvent): event is ErrorEvent {
    return event.type === 'error'
}

/**
 * 类型守卫：检查是否为性能事件
 */
export function isPerformanceEvent(event: MonitoringEvent): event is PerformanceEvent {
    return event.type === 'performance' || event.type === 'webVital'
}

/**
 * 类型守卫：检查是否为消息事件
 */
export function isMessageEvent(event: MonitoringEvent): event is MessageEvent {
    return event.type === 'message'
}

/**
 * 类型守卫：检查是否为事务事件
 */
export function isTransactionEvent(event: MonitoringEvent): event is TransactionEvent {
    return event.type === 'transaction'
}

/**
 * 类型守卫：检查是否为自定义事件
 */
export function isCustomEvent(event: MonitoringEvent): event is CustomEvent {
    return event.type === 'custom'
}

/**
 * 面包屑类型
 */
export interface Breadcrumb {
    message: string
    level?: 'debug' | 'info' | 'warning' | 'error'
    category?: string
    timestamp?: number
    data?: Record<string, unknown>
}

/**
 * 用户信息
 */
export interface User {
    id?: string
    email?: string
    username?: string
    ip_address?: string
    [key: string]: unknown
}

/**
 * Scope 接口
 * 管理事件的上下文信息
 */
export interface Scope {
    // 用户信息
    setUser(user: User | null): void
    getUser(): User | null

    // 标签
    setTag(key: string, value: string): void
    setTags(tags: Record<string, string>): void
    getTags(): Readonly<Record<string, string>>

    // 额外数据
    setExtra(key: string, value: unknown): void
    setExtras(extras: Record<string, unknown>): void
    getExtras(): Readonly<Record<string, unknown>>

    // 面包屑
    addBreadcrumb(breadcrumb: Breadcrumb): void
    getBreadcrumbs(): ReadonlyArray<Breadcrumb>

    // 上下文
    setContext(name: string, context: Record<string, unknown> | null): void
    getContext(name: string): Record<string, unknown> | null

    // 级别
    setLevel(level: EventLevel): void
    getLevel(): EventLevel | undefined

    // 操作
    clear(): void
    clone(): Scope
    applyToEvent(event: MonitoringEvent): MonitoringEvent
}
