import { Transport } from '@sky-monitor/monitor-sdk-core'

/**
 * 错误处理
 */
export class Errors {
    private transport: Transport | null = null

    constructor() {}

    init(transport: Transport) {
        this.transport = transport

        window.onerror = (message, source /* , lineno, colno, error */) => {
            if (this.transport) {
                this.transport.send({
                    type: 'error',
                    message: `${message} at ${source}`,
                    path: window.location.pathname,
                })
            }
        }

        window.onunhandledrejection = event => {
            if (this.transport) {
                this.transport.send({
                    type: 'unhandledrejection',
                    message: String(event.reason),
                    path: window.location.pathname,
                })
            }
        }
    }
}
