import { Transport } from '@sky-monitor/monitor-sdk-core'

import { onCLS, onFCP, onLCP, onTTFB } from '../metrics'

export class Metrics {
    constructor(private transport: Transport) {}

    init() {
        ;[onCLS, onLCP, onFCP, onTTFB].forEach(metricFn => {
            metricFn(metric => {
                this.transport.send({
                    type: 'webVital',
                    name: metric.name,
                    value: metric.value,
                    path: window.location.pathname,
                })
            })
        })
    }
}
