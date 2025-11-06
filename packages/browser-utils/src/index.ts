/**
 *  获取浏览器信息
 * @returns
 */
export function getBrowserInfo() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        referrer: document.referrer,
        path: location.pathname,
    }
}

// 主入口：导出 Metrics 集成和通用 metrics API
export { Metrics } from './integrations/metrics.js'

// 导出常用的 metrics
export * from './metrics/index.js'

// 额外导出 resourceTiming 相关（已在 metrics/index.ts 中导出，这里为了兼容性再次导出）
export { collectResourceTiming, observeResourceTiming } from './metrics/resourceTiming.js'
export type { ResourceTimingOptions } from './metrics/resourceTiming.js'

// 额外导出 getSelector 工具（已在 metrics/index.ts 中导出，这里为了兼容性再次导出）
export { getSelector } from './metrics/lib/getSelector.js'
