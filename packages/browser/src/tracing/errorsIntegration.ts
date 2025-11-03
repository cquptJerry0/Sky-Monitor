import { captureEvent, Integration, MonitoringEvent } from '@sky-monitor/monitor-sdk-core'

/**
 * 错误捕获集成
 */
export class Errors implements Integration {
    name = 'Errors'

    /**
     * 全局初始化，仅执行一次
     * 注册全局错误监听器
     */
    setupOnce(): void {
        window.onerror = this.handleError.bind(this)
        window.onunhandledrejection = this.handleRejection.bind(this)
    }

    /**
     * 处理全局错误
     */
    private handleError(message: string | Event, source?: string, lineno?: number, colno?: number, error?: Error): void {
        const event: MonitoringEvent = {
            type: 'error',
            message: typeof message === 'string' ? `${message} at ${source}` : String(message),
            lineno,
            colno,
            stack: error?.stack,
            path: window.location.pathname,
            timestamp: new Date().toISOString(),
        }
        captureEvent(event)
    }

    /**
     * 处理未捕获的Promise拒绝
     */
    private handleRejection(event: PromiseRejectionEvent): void {
        captureEvent({
            type: 'unhandledrejection',
            message: String(event.reason),
            stack: event.reason?.stack,
            path: window.location.pathname,
            timestamp: new Date().toISOString(),
        })
    }
}
