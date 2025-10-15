import { Transport } from '@sky-monitor/monitor-sdk-core'

/**
 * 错误处理
 */
export class Errors {
    constructor(private transport: Transport) {}

    init() {
        window.onerror = (message, source /* , lineno, colno, error */) => {
            this.transport.send({
                type: message,
                message: source,
                path: window.location.pathname,
            })
        }

        window.onunhandledrejection = event => {
            this.transport.send({
                type: 'unhandledrejection',
                message: event.reason,
                path: window.location.pathname,
            })
        }
    }
}
