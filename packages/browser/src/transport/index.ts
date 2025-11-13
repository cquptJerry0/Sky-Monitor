// packages/monitor-sdk-browser/src/transport.ts
import { BaseTransport, TransportCallbacks } from '@sky-monitor/monitor-sdk-core'

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
                // 不抛出错误,只记录日志和触发回调
                // 这样可以防止 Transport 错误被 ErrorsIntegration 捕获,导致无限循环
                console.error(`[BrowserTransport] HTTP error! status: ${response.status}`)
                this.triggerError(new Error(`HTTP error! status: ${response.status}`))
                return
            }

            this.triggerSuccess()
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))

            // 重试逻辑（指数退避）
            if (retries < this.maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, retries), 10000)
                console.warn(`[BrowserTransport] Request failed, retrying in ${delay}ms (attempt ${retries + 1}/${this.maxRetries})`)
                await new Promise(resolve => setTimeout(resolve, delay))
                return this.send(data, retries + 1)
            }

            // 重试次数用尽,不抛出错误,只记录日志和触发回调
            // 原则: Transport 层的职责是发送数据,失败时应该静默处理,而不是抛出错误
            // 这样可以防止无限循环: Transport 错误 → ErrorsIntegration 捕获 → 再次上报 → 再次失败
            console.error('[BrowserTransport] Request failed after retries:', error)
            this.triggerError(error)
            return
        }
    }
}
