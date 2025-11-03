export { browserTracingIntegration } from './tracing/browserTracingIntegration'

import { Integration, Monitoring } from '@sky-monitor/monitor-sdk-core'

import { BrowserTransport } from './transport'
import { BatchedTransport } from './transport/batched'

export { Metrics } from '@sky-monitor/monitor-sdk-browser-utils'
export { Errors } from './tracing/errorsIntegration'
export { SamplingIntegration } from '@sky-monitor/monitor-sdk-core'
export type { SamplingConfig } from '@sky-monitor/monitor-sdk-core'
export { BatchedTransport } from './transport/batched'
export type { BatchedTransportOptions } from './transport/batched'

/**
 * 初始化浏览器监控SDK
 */
export function init(options: {
    dsn: string
    integrations: Integration[]
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

    monitoring.init(transport)

    return monitoring
}

/**
 * 使用示例：
 *
 * import { init, Errors, Metrics, SamplingIntegration } from '@sky-monitor/monitor-sdk-browser'
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
 */
