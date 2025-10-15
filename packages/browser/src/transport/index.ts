// packages/monitor-sdk-browser/src/transport.ts
import { Transport } from '@sky-monitor/monitor-sdk-core'

export class BrowserTransport implements Transport {
    constructor(private dsn: string) {}

    send(data: Record<string, unknown>) {
        fetch(this.dsn, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).catch(err => console.error('Failed to send data', err))
    }
}
