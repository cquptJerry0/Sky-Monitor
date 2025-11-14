/**
 * Sky Monitor SDK 初始化
 *
 * 按照 Sentry 的最佳实践：
 * - 在独立文件中初始化 SDK
 * - 在应用入口的第一行导入
 * - 确保 SDK 在 React 渲染之前初始化
 */
import { init, createMonitoringConfig } from '@sky-monitor/monitor-sdk-browser'
import { setSDKClient } from './sdk'

// 声明全局变量（由 Vite 注入）
declare const __RELEASE__: string

// 启用开发模式调试
if (typeof window !== 'undefined') {
    ;(window as any).__DEV__ = true
}

// 应用配置
const APP_ID = 'vanilla1bhOoq'
const DSN = `http://localhost:8080/api/monitoring/${APP_ID}`

// 获取 release 版本（构建时注入，开发环境使用默认值）
const RELEASE = typeof __RELEASE__ !== 'undefined' ? __RELEASE__ : '1.0.0-e2e-dev'

// 初始化 Sky Monitor SDK
const config = createMonitoringConfig({
    dsn: DSN,
    appId: APP_ID,
    release: RELEASE,
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
        enableOffline: true,
        offlineQueueSize: 100,
        retryInterval: 3000,
    },
})

// 初始化 SDK（异步）
init(config)
    .then(client => {
        setSDKClient(client)
        console.log('[Sky Monitor] SDK initialized successfully')
    })
    .catch(error => {
        console.error('[Sky Monitor] SDK initialization failed:', error)
    })
