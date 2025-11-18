/**
 * Sky Monitor SDK 初始化
 *
 * 按照 Sentry 的最佳实践：
 * - 在独立文件中初始化 SDK
 * - 在应用入口的第一行导入
 * - 确保 SDK 在 React 渲染之前初始化
 */
import { init, createMonitoringConfig, setUser } from '@sky-monitor/monitor-sdk-browser'
import { setSDKClient } from './sdk'
import { getCurrentUser } from './utils/user'

// 声明全局变量（由 Vite 注入）
declare const __RELEASE__: string

// 启用开发模式调试
if (typeof window !== 'undefined') {
    ;(window as any).__DEV__ = true
}

// 从 URL 参数读取 appId,如果没有则使用默认值
const urlParams = new URLSearchParams(window.location.search)
const APP_ID = urlParams.get('appId') || 'vanilla1bhOoq'
const DSN = `http://localhost:8080/api/monitoring/${APP_ID}`

// 获取 release 版本（构建时注入，开发环境使用默认值）
const RELEASE = typeof __RELEASE__ !== 'undefined' ? __RELEASE__ : '1.0.0-e2e-dev'

// 生成随机用户信息
const currentUser = getCurrentUser()

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
        enableLongTask: true,
    },
    sampling: {
        // 错误类事件 (推荐 100%)
        errorSampleRate: 1.0, // 错误事件采样率
        exceptionSampleRate: 1.0, // 异常事件采样率
        unhandledrejectionSampleRate: 1.0, // Promise 拒绝采样率

        // 性能类事件 (推荐 30%-50%)
        performanceSampleRate: 0.3, // HTTP 性能事件采样率
        webVitalSampleRate: 0.5, // Web Vitals 采样率

        // 用户行为类事件
        breadcrumbSampleRate: 0.1, // 面包屑采样率 (推荐 10%)
        messageSampleRate: 1.0, // 消息事件采样率
        transactionSampleRate: 0.3, // 事务事件采样率
        customSampleRate: 0.5, // 自定义事件采样率

        // 默认采样率 (未配置的事件类型使用此值)
        defaultSampleRate: 1.0, // 默认 100%
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

        // 设置随机用户信息
        setUser({
            id: currentUser.id,
            email: currentUser.email,
            username: currentUser.username,
        })
        console.log('[Sky Monitor] User info set:', currentUser.username)
    })
    .catch(error => {
        console.error('[Sky Monitor] SDK initialization failed:', error)
    })
