import {
    init,
    Errors,
    Metrics,
    SessionIntegration,
    HttpErrorIntegration,
    ResourceErrorIntegration,
    PerformanceIntegration,
    BreadcrumbIntegration,
    SessionReplayIntegration,
    ResourceTimingIntegration,
    SamplingIntegration,
    DeduplicationIntegration,
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

    try {
        monitoringClient = await init({
            dsn: DSN,
            appId,
            release: '1.0.0-e2e',
            environment: 'development',
            integrations: [
                new Errors({
                    captureResourceErrors: true,
                    collectDeviceInfo: true,
                    collectNetworkInfo: true,
                }),
                new Metrics(),
                new BreadcrumbIntegration({
                    console: true,
                    dom: true,
                    fetch: true,
                    history: true,
                    xhr: true,
                }),
                new SessionReplayIntegration({
                    mode: 'onError',
                    bufferDuration: 60,
                    afterErrorDuration: 10,
                    maskAllInputs: true,
                }),
                new HttpErrorIntegration({
                    captureSuccessfulRequests: false,
                    captureHeaders: true,
                    captureBody: false,
                }),
                new ResourceErrorIntegration(),
                new PerformanceIntegration({
                    traceFetch: true,
                    traceXHR: true,
                    slowRequestThreshold: 3000,
                    traceAllRequests: false,
                }),
                new SessionIntegration({
                    sessionTimeout: 30 * 60 * 1000,
                }),
                new ResourceTimingIntegration(),
                new SamplingIntegration({
                    errorSampleRate: 1.0,
                    performanceSampleRate: 1.0,
                    webVitalSampleRate: 1.0, // Web Vitals 100% 采样
                }),
                new DeduplicationIntegration({
                    timeWindow: 60000, // 60 秒去重窗口（与之前的 Browser 层一致）
                    maxCacheSize: 200, // 增加缓存容量
                }),
            ],
            batchSize: 20,
            flushInterval: 5000,
        })

        console.log('[SDK] Initialized successfully')
        return monitoringClient
    } catch (error) {
        console.error('[SDK] Initialization failed:', error)
        throw error
    }
}

export function getSDKClient() {
    return monitoringClient
}

export { addBreadcrumb, setUser, setTag, captureEvent, captureException, captureMessage }
