import { captureEvent, Integration } from '@sky-monitor/monitor-sdk-core'

import { onCLS, onFCP, onLCP, onTTFB } from '../metrics'

/**
 * Web Vitals性能指标集成
 */

export class Metrics implements Integration {
    name = 'Metrics'

    /**
     * 全局初始化，仅执行一次
     * 注册Web Vitals指标监听
     */
    setupOnce(): void {
        ;[onCLS, onLCP, onFCP, onTTFB].forEach(metricFn => {
            metricFn(metric => {
                captureEvent({
                    type: 'webVital',
                    name: metric.name,
                    value: metric.value,
                    path: window.location.pathname,
                    timestamp: new Date().toISOString(),
                })
            })
        })
    }
}
