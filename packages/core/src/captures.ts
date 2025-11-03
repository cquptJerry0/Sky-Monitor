import { getCurrentClient } from './baseClient'
import { MonitoringEvent } from './types'

/**
 * 捕获异常
 */
export function captureException(error: Error): void {
    const client = getCurrentClient()
    if (client) {
        client.captureEvent({
            type: 'exception',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
        })
    }
}

/**
 * 捕获消息
 */
export function captureMessage(message: string): void {
    const client = getCurrentClient()
    if (client) {
        client.captureEvent({
            type: 'message',
            message,
            timestamp: new Date().toISOString(),
        })
    }
}

/**
 * 捕获事件
 */
export function captureEvent(event: MonitoringEvent): void {
    const client = getCurrentClient()
    if (client) {
        client.captureEvent(event)
    }
}
