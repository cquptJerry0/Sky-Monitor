import { Transport } from './transport'
import { MonitoringOptions } from './types'

export class Monitoring {
    private transport: Transport | null = null

    constructor(private options: MonitoringOptions) {}

    init(transport: Transport) {
        this.transport = transport
        this.options.integrations.forEach(integration => {
            integration.init(transport)
        })
    }

    reportMessage(message: string) {
        this.transport?.send({ type: 'message', message })
    }

    reportEvent(event: unknown) {
        this.transport?.send({ type: 'event', event })
    }
}
