import { IsOptional, IsString, IsNumber, IsObject, IsArray, IsBoolean } from 'class-validator'

/**
 * 错误指纹 DTO
 */
export class ErrorFingerprintDto {
    @IsString()
    hash: string

    @IsString()
    algorithm: string
}

/**
 * 设备信息 DTO
 */
export class DeviceInfoDto {
    @IsString()
    @IsOptional()
    browser?: string

    @IsString()
    @IsOptional()
    browserVersion?: string

    @IsString()
    @IsOptional()
    os?: string

    @IsString()
    @IsOptional()
    osVersion?: string

    @IsString()
    @IsOptional()
    deviceType?: string

    @IsString()
    @IsOptional()
    screenResolution?: string

    @IsString()
    @IsOptional()
    language?: string

    @IsString()
    @IsOptional()
    timezone?: string
}

/**
 * 网络信息 DTO
 */
export class NetworkInfoDto {
    @IsString()
    @IsOptional()
    effectiveType?: string

    @IsNumber()
    @IsOptional()
    downlink?: number

    @IsNumber()
    @IsOptional()
    rtt?: number

    @IsOptional()
    saveData?: boolean
}

/**
 * HTTP 错误详情 DTO
 */
export class HttpErrorDetailsDto {
    @IsString()
    url: string

    @IsString()
    method: string

    @IsNumber()
    status: number

    @IsString()
    statusText: string

    @IsNumber()
    duration: number

    @IsOptional()
    requestHeaders?: Record<string, string>

    @IsOptional()
    responseHeaders?: Record<string, string>

    @IsOptional()
    requestBody?: any

    @IsOptional()
    responseBody?: any
}

/**
 * 资源错误详情 DTO
 */
export class ResourceErrorDetailsDto {
    @IsString()
    url: string

    @IsString()
    tagName: string

    @IsString()
    resourceType: string

    @IsString()
    @IsOptional()
    outerHTML?: string
}

/**
 * Vue 错误详情 DTO
 */
export class VueErrorDetailsDto {
    @IsString()
    @IsOptional()
    componentName?: string

    @IsOptional()
    componentHierarchy?: string[]

    @IsString()
    @IsOptional()
    lifecycle?: string

    @IsOptional()
    props?: Record<string, any>
}

/**
 * React 错误详情 DTO
 */
export class ReactErrorDetailsDto {
    @IsString()
    @IsOptional()
    componentName?: string

    @IsString()
    @IsOptional()
    componentStack?: string

    @IsString()
    @IsOptional()
    errorBoundary?: string
}

/**
 * 监控事件 DTO
 * 使用 class-validator 进行验证
 */
export class MonitoringEventDto {
    /**
     * 事件类型：error, unhandledrejection, httpError, resourceError, webVital, message, event
     */
    @IsString()
    type: string

    /**
     * 事件名称（对于webVital: LCP, FCP, CLS, TTFB等）
     */
    @IsString()
    @IsOptional()
    name?: string

    /**
     * 数值类型数据
     */
    @IsOptional()
    value?: string | number

    /**
     * 错误消息
     */
    @IsString()
    @IsOptional()
    message?: string

    /**
     * 错误堆栈
     */
    @IsString()
    @IsOptional()
    stack?: string

    /**
     * 错误行号
     */
    @IsNumber()
    @IsOptional()
    lineno?: number

    /**
     * 错误列号
     */
    @IsNumber()
    @IsOptional()
    colno?: number

    /**
     * 错误指纹
     */
    @IsObject()
    @IsOptional()
    errorFingerprint?: ErrorFingerprintDto

    /**
     * 设备信息
     */
    @IsObject()
    @IsOptional()
    device?: DeviceInfoDto

    /**
     * 网络信息
     */
    @IsObject()
    @IsOptional()
    network?: NetworkInfoDto

    /**
     * HTTP 错误详情
     */
    @IsObject()
    @IsOptional()
    httpError?: HttpErrorDetailsDto

    /**
     * 资源错误详情
     */
    @IsObject()
    @IsOptional()
    resourceError?: ResourceErrorDetailsDto

    /**
     * Vue 错误详情
     */
    @IsObject()
    @IsOptional()
    vueError?: VueErrorDetailsDto

    /**
     * React 错误详情
     */
    @IsObject()
    @IsOptional()
    reactError?: ReactErrorDetailsDto

    /**
     * 框架类型
     */
    @IsString()
    @IsOptional()
    framework?: string

    /**
     * 页面路径
     */
    @IsString()
    @IsOptional()
    path?: string

    /**
     * 任意事件数据（向后兼容）
     */
    @IsOptional()
    event?: any

    /**
     * 浏览器 User-Agent
     */
    @IsString()
    @IsOptional()
    userAgent?: string

    /**
     * 版本号
     */
    @IsString()
    @IsOptional()
    release?: string

    /**
     * Session 会话ID
     */
    @IsString()
    @IsOptional()
    sessionId?: string

    /**
     * Session 会话元数据
     */
    @IsObject()
    @IsOptional()
    _session?: {
        startTime: number
        duration: number
        eventCount: number
        errorCount: number
        pageViews: number
    }

    /**
     * 用户信息
     */
    @IsObject()
    @IsOptional()
    user?: {
        id?: string
        email?: string
        username?: string
        ip_address?: string
        [key: string]: unknown
    }

    /**
     * 标签（用于分类和过滤）
     */
    @IsObject()
    @IsOptional()
    tags?: Record<string, string>

    /**
     * 额外数据
     */
    @IsObject()
    @IsOptional()
    extra?: Record<string, unknown>

    /**
     * 面包屑（用户操作历史）
     */
    @IsArray()
    @IsOptional()
    breadcrumbs?: Array<{
        message: string
        level?: string
        category?: string
        timestamp?: number
        data?: Record<string, unknown>
    }>

    /**
     * 自定义上下文
     */
    @IsObject()
    @IsOptional()
    contexts?: Record<string, Record<string, unknown> | null>

    /**
     * 事件级别
     */
    @IsString()
    @IsOptional()
    level?: string

    /**
     * 环境
     */
    @IsString()
    @IsOptional()
    environment?: string

    /**
     * 性能分类
     */
    @IsString()
    @IsOptional()
    category?: string

    /**
     * 性能指标值
     */
    @IsNumber()
    @IsOptional()
    metrics?: Record<string, number>

    /**
     * 是否为慢请求
     */
    @IsBoolean()
    @IsOptional()
    isSlow?: boolean

    /**
     * 请求是否成功
     */
    @IsBoolean()
    @IsOptional()
    success?: boolean

    /**
     * PerformanceIntegration 顶层字段: HTTP URL
     * (与 httpError.url 互补)
     */
    @IsString()
    @IsOptional()
    url?: string

    /**
     * PerformanceIntegration 顶层字段: HTTP Method
     * (与 httpError.method 互补)
     */
    @IsString()
    @IsOptional()
    method?: string

    /**
     * PerformanceIntegration 顶层字段: HTTP Status
     * (与 httpError.status 互补)
     */
    @IsNumber()
    @IsOptional()
    status?: number

    /**
     * PerformanceIntegration 顶层字段: Duration
     * (与 httpError.duration 互补)
     */
    @IsNumber()
    @IsOptional()
    duration?: number

    /**
     * Deduplication 去重元数据
     */
    @IsObject()
    @IsOptional()
    _deduplication?: {
        fingerprint: string
        count: number
    }

    /**
     * Sampling 采样元数据
     */
    @IsObject()
    @IsOptional()
    _sampling?: {
        rate: number
        sampled: boolean
        timestamp: number
    }

    /**
     * 事件时间戳（中国时区格式：YYYY-MM-DD HH:mm:ss）
     */
    @IsString()
    @IsOptional()
    timestamp?: string
}

/**
 * 批量监控事件 DTO
 */
export type BatchMonitoringEventsDto = MonitoringEventDto[]
