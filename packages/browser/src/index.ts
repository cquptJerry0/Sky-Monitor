export { browserTracingIntegration } from './tracing/browserTracingIntegration'

import { Integration, Monitoring } from '@sky-monitor/monitor-sdk-core'

import { BrowserTransport } from './transport'
import { BatchedTransport } from './transport/batched'

export { Metrics } from '@sky-monitor/monitor-sdk-browser-utils'
export { Errors } from './tracing/errorsIntegration'
export {
    SamplingIntegration,
    DeduplicationIntegration,
    setUser,
    setTag,
    addBreadcrumb,
    configureScope,
} from '@sky-monitor/monitor-sdk-core'
export type { SamplingConfig, DeduplicationConfig, Breadcrumb, User, Scope } from '@sky-monitor/monitor-sdk-core'
export type { ErrorsOptions } from './tracing/errorsIntegration'
export { HttpErrorIntegration } from './integrations/httpErrorIntegration'
export type { HttpErrorIntegrationOptions } from './integrations/httpErrorIntegration'
export { ResourceErrorIntegration } from './integrations/resourceErrorIntegration'
export type { ResourceErrorIntegrationOptions } from './integrations/resourceErrorIntegration'
export { SessionIntegration } from './integrations/session'
export type { SessionConfig } from './integrations/session'
export { ResourceTimingIntegration } from './integrations/resourceTiming'
export type { ResourceTimingIntegrationOptions } from './integrations/resourceTiming'
export { BreadcrumbIntegration } from './integrations/breadcrumb'
export type { BreadcrumbIntegrationOptions } from './integrations/breadcrumb'
export { SessionReplayIntegration } from './integrations/sessionReplay'
export type { SessionReplayOptions, RecordMode } from './integrations/sessionReplay'
export { PerformanceIntegration } from './tracing/performanceIntegration'
export type { PerformanceConfig } from './tracing/performanceIntegration'
export { BatchedTransport } from './transport/batched'
export type { BatchedTransportOptions } from './transport/batched'

// 导出类型
export type {
    DeviceInfo,
    NetworkInfo,
    ErrorFingerprint,
    HttpErrorDetails,
    ResourceErrorDetails,
    BrowserErrorEvent,
} from './types/errorTypes'

// 导出工具函数
export { collectDeviceInfo, collectNetworkInfo } from './utils/deviceInfo'
export { generateErrorFingerprint, errorDeduplicator } from './utils/errorFingerprint'

/**
 * 初始化浏览器监控SDK
 */
export async function init(options: {
    dsn: string
    integrations: Integration[]
    release?: string // 版本号
    enableBatching?: boolean // 是否启用批量传输，默认true
    batchSize?: number // 批次大小，默认20
    flushInterval?: number // 刷新间隔，默认5000ms
}) {
    const monitoring = new Monitoring()

    // 链式添加集成
    options.integrations.forEach(int => monitoring.addIntegration(int))

    // 创建传输层
    const browserTransport = new BrowserTransport(options.dsn)

    // 默认启用批量传输
    const transport =
        options.enableBatching !== false
            ? new BatchedTransport(browserTransport, {
                  batchSize: options.batchSize,
                  flushInterval: options.flushInterval,
              })
            : browserTransport

    await monitoring.init(transport, { release: options.release })

    return monitoring
}

/**
 * 使用示例：
 *
 * import { init, Errors, Metrics, SamplingIntegration, setUser, setTag, addBreadcrumb } from '@sky-monitor/monitor-sdk-browser'
 * import { captureException } from '@sky-monitor/monitor-sdk-core'
 *
 * const monitoring = init({
 *    dsn: 'http://localhost:8080/api/v1/monitoring/reactRqL9vG',
 *    integrations: [
 *        new Errors(),
 *        new SamplingIntegration({
 *            errorSampleRate: 1.0,
 *            performanceSampleRate: 0.3
 *        }),
 *        new Metrics()
 *    ],
 *    enableBatching: true,  // 默认true，启用批量传输
 *    batchSize: 20,         // 默认20，批次大小
 *    flushInterval: 5000    // 默认5000ms，刷新间隔
 * })
 *
 * // 设置用户信息（用于错误定位）
 * setUser({
 *    id: '123',
 *    email: 'user@example.com',
 *    username: 'john_doe'
 * })
 *
 * // 设置标签（用于分类和过滤）
 * setTag('environment', 'production')
 * setTag('version', '1.2.3')
 *
 * // 记录用户操作（面包屑追踪）
 * addBreadcrumb({
 *    message: 'User clicked login button',
 *    category: 'ui.click',
 *    level: 'info'
 * })
 *
 * addBreadcrumb({
 *    message: 'API call: POST /api/login',
 *    category: 'http',
 *    level: 'info'
 * })
 *
 * // 捕获异常时，会自动附加上述所有上下文
 * try {
 *    // 业务代码
 *    throw new Error('Login failed')
 * } catch (error) {
 *    captureException(error)
 *    // 发送的事件包含：
 *    // - user: { id, email, username }
 *    // - tags: { environment, version }
 *    // - breadcrumbs: [用户点击, API调用]
 * }
 */
