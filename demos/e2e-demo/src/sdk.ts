import {
    init,
    createMonitoringConfig,
    addBreadcrumb,
    setUser,
    setTag,
    captureEvent,
    captureException,
    captureMessage,
} from '@sky-monitor/monitor-sdk-browser'

let monitoringClient: any = null

export async function initializeSDK(appId: string) {
    const DSN = `http://localhost:8080/api/monitoring/${appId}`

    const config = createMonitoringConfig({
        dsn: DSN,
        appId,
        release: '1.0.0-e2e',
        environment: 'development',
        features: {
            captureErrors: true,
            captureResourceErrors: true,
            captureHttpErrors: true,
            enableReplay: true,
            enableMetrics: true,
            enableBreadcrumbs: true,
            enablePerformance: true,
            enableSession: true,
            enableResourceTiming: true,
        },
        sampling: {
            errorSampleRate: 1.0,
            performanceSampleRate: 1.0,
            webVitalSampleRate: 1.0,
        },
        transport: {
            batchSize: 20,
            flushInterval: 5000,
            enableOffline: true, // 启用离线队列
            offlineQueueSize: 100, // 离线队列最大大小
            retryInterval: 3000, // 重试间隔 3 秒
        },
    })

    monitoringClient = await init(config)

    return monitoringClient
}

export function getSDKClient() {
    return monitoringClient
}

export { addBreadcrumb, setUser, setTag, captureEvent, captureException, captureMessage }
