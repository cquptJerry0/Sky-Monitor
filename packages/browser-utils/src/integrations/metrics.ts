import { Transport } from '@sky-monitor/monitor-sdk-core'

import { onCLS, onFCP, onLCP, onTTFB } from '../metrics'

export class Metrics {
    private transport: Transport | null = null

    constructor() {}

    init(transport: Transport) {
        this.transport = transport
        ;[onCLS, onLCP, onFCP, onTTFB].forEach(metricFn => {
            metricFn(metric => {
                if (this.transport) {
                    this.transport.send({
                        type: 'webVital',
                        name: metric.name,
                        value: metric.value,
                        path: window.location.pathname,
                    })
                }
            })
        })
    }
}
