import { captureMessage } from '@sky-monitor/monitor-sdk-core'

export const browserTracingIntegration = () => {
    /**
     * 示例
     */
    captureMessage('browserTracingIntegration')
    return {
        name: 'browserTracingIntegration',
        setupOnce() {
            // TODO: 实现浏览器追踪逻辑
        },
    }
}
