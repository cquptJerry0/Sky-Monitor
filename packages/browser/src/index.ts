export { browserTracingIntegration } from './tracing/browserTracingIntegration'

import { Integration, Monitoring, Transport } from '@sky-monitor/monitor-sdk-core'

import { TransportRouter } from './transport/transport-router'
import { OfflineTransport } from './transport/offline'

export { Metrics } from '@sky-monitor/monitor-sdk-browser-utils'
export { Errors } from './tracing/errorsIntegration'
export {
    SamplingIntegration,
    DeduplicationIntegration,
    setUser,
    setTag,
    addBreadcrumb,
    configureScope,
    captureEvent,
    captureException,
    captureMessage,
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
export { LayeredTransportManager, EventLayer } from './transport/layered-transport-manager'
export type { LayeredTransportConfig } from './transport/layered-transport-manager'
export { TransportRouter } from './transport/transport-router'
export type { TransportRouterConfig } from './transport/transport-router'
export { OfflineTransport } from './transport/offline'
export type { OfflineTransportOptions } from './transport/offline'

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
    appId?: string // 应用ID
    environment?: string // 环境标识
    batchSize?: number // 批次大小，默认20
    flushInterval?: number // 刷新间隔，默认5000ms
    enableOffline?: boolean // 是否启用离线队列
    offlineQueueSize?: number // 离线队列大小
    retryInterval?: number // 重试间隔
    // 自定义端点路径（可选）
    endpoints?: {
        critical?: string // 关键事件端点，默认 /critical
        batch?: string // 批量事件端点，默认 /batch
        replay?: string // Replay 事件端点，默认 /replay
    }
}) {
    const monitoring = new Monitoring()

    // 链式添加集成
    options.integrations.forEach(int => monitoring.addIntegration(int))

    // 创建传输层 - 统一使用 TransportRouter
    let transport: Transport = new TransportRouter({
        baseEndpoint: options.dsn,
        batched: {
            batchSize: options.batchSize,
            flushInterval: options.flushInterval,
        },
        immediate: {
            endpoint: options.endpoints?.critical ? `${options.dsn}${options.endpoints.critical}` : undefined,
        },
        replay: {
            endpoint: options.endpoints?.replay ? `${options.dsn}${options.endpoints.replay}` : undefined,
        },
    })

    // 如果启用离线，包装 TransportRouter
    if (options.enableOffline) {
        transport = new OfflineTransport(transport, {
            maxQueueSize: options.offlineQueueSize,
            retryInterval: options.retryInterval,
        })
    }

    await monitoring.init(transport, {
        release: options.release,
        appId: options.appId,
        environment: options.environment,
    })

    return monitoring
}

/**
 * 使用示例：
 *
 * import { init, Errors, Metrics, SamplingIntegration, setUser, setTag, addBreadcrumb } from '@sky-monitor/monitor-sdk-browser'
 * import { captureException } from '@sky-monitor/monitor-sdk-core'
 *
 * const monitoring = init({
 *    dsn: 'http://localhost:8080/api/monitoring/reactRqL9vG',
 *    integrations: [
 *        new Errors(),
 *        new SamplingIntegration({
 *            errorSampleRate: 1.0,
 *            performanceSampleRate: 0.3
 *        }),
 *        new Metrics()
 *    ],
 *    batchSize: 20,         // 批次大小，默认20
 *    flushInterval: 5000    // 刷新间隔，默认5000ms
 * })
 *
 * // 事件自动路由到不同端点：
 * // - 错误事件 → /critical (立即发送)
 * // - Replay 事件 → /replay (专用通道)
 * // - 其他事件 → /batch (批量发送)
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
