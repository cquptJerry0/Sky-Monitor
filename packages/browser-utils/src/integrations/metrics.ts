import { captureEvent, getChinaTimestamp, Integration } from '@sky-monitor/monitor-sdk-core'

import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } from '../metrics'

/**
 * Web Vitals性能指标集成
 *
 * 采集以下核心指标：
 * - CLS (Cumulative Layout Shift): 累积布局偏移
 * - FCP (First Contentful Paint): 首次内容绘制
 * - FID (First Input Delay): 首次输入延迟
 * - INP (Interaction to Next Paint): 交互到下一次绘制
 * - LCP (Largest Contentful Paint): 最大内容绘制
 * - TTFB (Time to First Byte): 首字节时间
 */

export class Metrics implements Integration {
    name = 'Metrics'

    /**
     * 全局初始化，仅执行一次
     * 注册Web Vitals指标监听
     */
    setupOnce(): void {
        // 注册所有 Web Vitals 指标
        // 注意：
        // - FCP/TTFB/LCP - 页面加载时自动上报
        // - FID - 首次用户交互后上报
        // - CLS - 等待 FCP 后开始计算，页面隐藏时上报
        // - INP - 需要用户交互，页面隐藏时上报
        ;[onCLS, onFCP, onFID, onINP, onLCP, onTTFB].forEach(metricFn => {
            metricFn(metric => {
                captureEvent({
                    type: 'webVital',
                    name: metric.name,
                    value: metric.value,
                    rating: metric.rating,
                    path: window.location.pathname,
                    timestamp: getChinaTimestamp(),
                })
            })
        })
    }
}
