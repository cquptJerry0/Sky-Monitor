import { captureConsoleIntegration, captureMessage } from '@sky-monitor/monitor-sdk-core'

export const browserTracingIntegration = () => {
    /**
     * 示例
     */
    captureMessage('browserTracingIntegration')
    return {
        name: 'browserTracingIntegration',
        setupOnce() {
            captureConsoleIntegration()
        },
    }
}
