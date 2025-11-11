// packages/monitor-sdk-browser/src/transport.ts
import { BaseTransport, TransportCallbacks } from '@sky-monitor/monitor-sdk-core'

export class BrowserTransport extends BaseTransport {
    constructor(
        private dsn: string,
        callbacks?: TransportCallbacks
    ) {
        super(callbacks)
    }

    async send(data: Record<string, unknown>): Promise<void> {
        try {
            // 检查是否为批量数据
            const isBatch = data.type === 'batch' && Array.isArray(data.events)
            const url = isBatch ? `${this.dsn}/batch` : this.dsn
            const body = isBatch ? JSON.stringify(data.events) : JSON.stringify(data)

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            this.triggerSuccess()
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            this.triggerError(error)
            // Error already reported via triggerError callback
        }
    }
}
