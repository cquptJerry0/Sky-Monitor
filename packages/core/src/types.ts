import { Transport } from './transport'

/**
 * 监控事件标准接口
 */
export interface MonitoringEvent {
    type: string
    timestamp?: string
    [key: string]: unknown
}

/**
 * Integration interface
 * 集成接口
 * 基于插件化设计
 */
export interface Integration {
    name: string

    // 全局初始化，仅执行一次（注册全局监听器）
    setupOnce?(): void

    // 每次SDK初始化时调用（接收transport）
    init?(transport: Transport): void

    // 事件发送前处理钩子（修改/过滤事件）
    beforeSend?(event: MonitoringEvent): MonitoringEvent | null | Promise<MonitoringEvent | null>
}

/**
 * Monitoring options
 * 监控相关配置
 */
export interface MonitoringOptions {
    dsn: string
    integrations: Integration[]
}
