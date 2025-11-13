import { getCurrentClient } from './baseClient'
import { MonitoringEvent } from './types'
import { getChinaTimestamp } from './utils/time'

/**
 * 捕获异常
 */
export function captureException(error: Error): void {
    const client = getCurrentClient()
    if (client) {
        client.captureEvent({
            type: 'error',
            message: error.message,
            stack: error.stack,
            timestamp: getChinaTimestamp(),
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
            timestamp: getChinaTimestamp(),
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
