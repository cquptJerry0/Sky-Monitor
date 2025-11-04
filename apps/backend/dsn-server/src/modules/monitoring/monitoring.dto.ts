import { IsOptional, IsString, IsNumber, IsObject } from 'class-validator'

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
     * 错误堆栈信息
     */
    @IsString()
    @IsOptional()
    stack?: string
}

/**
 * 批量监控事件 DTO
 */
export type BatchMonitoringEventsDto = MonitoringEventDto[]
