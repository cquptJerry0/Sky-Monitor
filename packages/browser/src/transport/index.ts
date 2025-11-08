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
            const response = await fetch(this.dsn, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
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
