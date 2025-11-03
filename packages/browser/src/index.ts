export { browserTracingIntegration } from './tracing/browserTracingIntegration'

import { Integration, Monitoring } from '@sky-monitor/monitor-sdk-core'

import { BrowserTransport } from './transport'
export { Metrics } from '@sky-monitor/monitor-sdk-browser-utils'
export { Errors } from './tracing/errorsIntegration'

/**
 * 初始化浏览器监控SDK
 */
export function init(options: { dsn: string; integrations: Integration[] }) {
    const monitoring = new Monitoring()

    // 链式添加集成
    options.integrations.forEach(int => monitoring.addIntegration(int))

    const transport = new BrowserTransport(options.dsn)
    monitoring.init(transport)

    return monitoring
}

/**
 * 使用示例：
 *
 * import { init, Errors, Metrics } from '@sky-monitor/monitor-sdk-browser'
 *
 * const monitoring = init({
 *    dsn: 'http://localhost:8080/api/v1/monitoring/reactRqL9vG',
 *    integrations: [new Errors(), new Metrics()],
 * })
 */
