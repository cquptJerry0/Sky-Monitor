import { IsOptional, IsString } from 'class-validator'

/**
 * 监控事件 DTO
 * 使用 class-validator 进行验证
 */
export class MonitoringEventDto {
    /**
     * 事件类型：error, unhandledrejection, webVital, message, event
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
     * 页面路径
     */
    @IsString()
    @IsOptional()
    path?: string

    /**
     * 任意事件数据
     */
    @IsOptional()
    event?: any

    /**
     * 浏览器 User-Agent
     */
    @IsString()
    @IsOptional()
    userAgent?: string
}

/**
 * 批量监控事件 DTO
 */
export type BatchMonitoringEventsDto = MonitoringEventDto[]
