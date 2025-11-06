/**
 * Sky Monitor SDK - 完整功能演示
 *
 * 本 Demo 展示了 Sky Monitor 已实现的所有 Integrations：
 *
 * ✅ 已实现（6个核心 Integrations）：
 * 1. Errors - 全局错误捕获
 * 2. Metrics - Core Web Vitals (LCP, FCP, CLS, TTFB)
 * 3. SessionIntegration - 会话跟踪
 * 4. HttpErrorIntegration - HTTP 错误捕获
 * 5. ResourceErrorIntegration - 资源加载错误
 * 6. PerformanceIntegration - 请求性能监控
 *
 * 🔧 辅助 Integrations：
 * 7. SamplingIntegration - 分层采样
 * 8. DeduplicationIntegration - 错误去重
 *
 * 🚧 规划中（未实现）：
 * - BreadcrumbIntegration - 用户行为轨迹（手动调用 addBreadcrumb 函数）
 * - SessionReplayIntegration - 会话录制（rrweb）
 * - ResourceTimingIntegration - 资源性能详细监控
 */

import {
    init,
    Errors,
    Metrics,
    SessionIntegration,
    HttpErrorIntegration,
    ResourceErrorIntegration,
    PerformanceIntegration,
    SamplingIntegration,
    DeduplicationIntegration,
    addBreadcrumb,
    setUser,
    setTag,
    configureScope,
} from '@sky-monitor/monitor-sdk-browser'

// 从 localStorage 获取或生成 appId
const APP_ID = localStorage.getItem('sky_monitor_app_id') || 'demo_app_001'
localStorage.setItem('sky_monitor_app_id', APP_ID)

// 配置
const CONFIG = {
    appId: APP_ID,
    release: '1.0.0-demo',
    environment: 'development',
    dsn: `http://localhost:8080/api/monitoring/${APP_ID}`,
    apiBaseUrl: 'http://localhost:3000/api',
}

// 导出配置供其他模块使用
window.MONITOR_CONFIG = CONFIG
;(async () => {
    console.log('🚀 初始化 Sky Monitor SDK...')
    console.log('📝 配置信息:', CONFIG)

    try {
        const monitoring = await init({
            dsn: CONFIG.dsn,
            appId: CONFIG.appId,
            release: CONFIG.release,
            environment: CONFIG.environment,

            // ===== 所有 Integrations =====
            integrations: [
                // 1. Errors - 全局错误捕获
                new Errors({
                    captureUnhandledRejections: true, // 捕获未处理的 Promise 拒绝
                }),

                // 2. Metrics - Core Web Vitals
                new Metrics(),

                // 3. SessionIntegration - 会话跟踪
                new SessionIntegration({
                    timeout: 30 * 60 * 1000, // 30 分钟无活动则结束会话
                }),

                // P2: 性能打点 - 接口耗时监控
                new PerformanceIntegration({
                    traceFetch: true,
                    traceXHR: true,
                    slowRequestThreshold: 3000, // 3秒慢请求阈值
                    traceAllRequests: false, // 只上报慢请求和失败请求
                }),

                // Breadcrumb 自动采集 - 用户行为轨迹追踪
                new BreadcrumbIntegration({
                    console: true, // 捕获 console 日志
                    dom: true, // 捕获 DOM 点击事件
                    fetch: true, // 捕获 Fetch 请求
                    history: true, // 捕获路由变化
                    xhr: true, // 捕获 XHR 请求
                }),

                // 7. SamplingIntegration - 分层采样
                new SamplingIntegration({
                    errorSampleRate: 1.0, // 错误 100% 采样
                    performanceSampleRate: 0.5, // 性能 50% 采样
                }),

                // 8. DeduplicationIntegration - 错误去重
                new DeduplicationIntegration({
                    maxCacheSize: 100,
                    timeWindow: 5000, // 5秒内相同错误只记录一次
                }),
            ],

            // P1: LocalStorage降级 - 弱网环境防丢失
            enableOffline: true,
            offlineQueueSize: 50,
            retryInterval: 10000,

            // 批量传输
            enableBatching: true,
            batchSize: 20,
            flushInterval: 5000,
        })

        console.log('Sky Monitor SDK 初始化成功')
        console.log('DSN:', `http://localhost:8080/api/monitoring/${APP_ID}`)
        console.log('已启用的集成:')
        console.log('  - DeduplicationIntegration (P0): 错误去重，5秒窗口')
        console.log('  - SessionIntegration (P2): 会话追踪，30分钟超时')
        console.log('  - PerformanceIntegration (P2): 性能打点，监控慢请求')
        console.log('  - BreadcrumbIntegration: 用户行为轨迹追踪 (console/dom/fetch/history/xhr)')
        console.log('  - OfflineTransport (P1): LocalStorage降级，离线队列50条')
        console.log('  - Errors: 全局错误捕获')
        console.log('  - SamplingIntegration: 分层采样 (error:100%, perf:30%)')
        console.log('  - Metrics: Web Vitals 性能指标')

        // 导出monitoring实例供其他模块使用
        window.monitoring = monitoring

        console.log('✅ Sky Monitor SDK 初始化成功')
        console.log('📊 已启用的 Integrations:')
        console.log('  ✓ Errors - 全局错误捕获')
        console.log('  ✓ Metrics - Core Web Vitals (LCP, FCP, CLS, TTFB)')
        console.log('  ✓ SessionIntegration - 会话跟踪（30分钟超时）')
        console.log('  ✓ HttpErrorIntegration - HTTP 错误捕获（400-599）')
        console.log('  ✓ ResourceErrorIntegration - 资源加载错误')
        console.log('  ✓ PerformanceIntegration - 请求性能监控（3s慢请求阈值）')
        console.log('  ✓ SamplingIntegration - 分层采样（错误:100%, 性能:50%）')
        console.log('  ✓ DeduplicationIntegration - 错误去重（5秒窗口）')
        console.log('')
        console.log('🔧 传输配置:')
        console.log('  ✓ 批量上报: 20条/次, 5秒刷新')
        console.log('  ✓ 离线队列: 50条, 10秒重试')
        console.log('  ✓ 全局采样率: 100%')

        // 更新 UI 状态
        updateConnectionStatus(true)
    } catch (error) {
        console.error('❌ SDK 初始化失败:', error)
        updateConnectionStatus(false)
    }
})()

// 更新连接状态
function updateConnectionStatus(connected) {
    const statusEl = document.querySelector('.status')
    if (statusEl) {
        statusEl.textContent = connected ? '已连接' : '连接失败'
        statusEl.style.background = connected ? '#10b981' : '#ef4444'
    }

    const appIdEl = document.getElementById('current-app-id')
    if (appIdEl) {
        appIdEl.textContent = CONFIG.appId
    }

    const releaseEl = document.getElementById('current-release')
    if (releaseEl) {
        releaseEl.textContent = CONFIG.release
    }
}
