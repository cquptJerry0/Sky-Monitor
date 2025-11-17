// packages/monitor-sdk-browser/src/transport.ts
import { BaseTransport, TransportCallbacks } from '@sky-monitor/monitor-sdk-core'

/**
 * Transport 发送结果
 */
export interface TransportResponse {
    success: boolean
    statusCode?: number
    error?: Error
}

export class BrowserTransport extends BaseTransport {
    private maxRetries = 3

    constructor(
        private dsn: string,
        callbacks?: TransportCallbacks
    ) {
        super(callbacks)
    }

    async send(data: Record<string, unknown>, retries = 0): Promise<void> {
        try {
            // 检查是否为批量数据
            const isBatch = data.type === 'batch' && Array.isArray(data.events)
            const body = isBatch ? JSON.stringify(data.events) : JSON.stringify(data)

            const response = await fetch(this.dsn, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
            })

            if (!response.ok) {
                // HTTP 错误，触发错误回调并抛出异常
                // 这样 OfflineTransport 可以捕获异常并存储到 IndexedDB
                const error = new Error(`HTTP error! status: ${response.status}`)
                this.triggerError(error)
                throw error
            }

            this.triggerSuccess()
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))

            // 重试逻辑（指数退避）
            if (retries < this.maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, retries), 10000)
                await new Promise(resolve => setTimeout(resolve, delay))
                return this.send(data, retries + 1)
            }

            // 重试次数用尽，触发错误回调并抛出异常
            // 这样 OfflineTransport 可以捕获异常并存储到 IndexedDB
            this.triggerError(error)
            throw error
        }
    }
}
