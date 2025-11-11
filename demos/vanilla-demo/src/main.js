/**
 * Sky Monitor SDK - 完整功能演示
 *
 * 本 Demo 展示了 Sky Monitor 已实现的所有 11 个 Integrations：
 *
 * ✅ 核心监控 Integrations (8个)：
 * 1. Errors - 全局错误捕获（同步/异步/Promise/资源错误）
 * 2. Metrics - Core Web Vitals (LCP, FCP, CLS, TTFB)
 * 3. SessionIntegration - 会话跟踪（30分钟超时，持久化）
 * 4. HttpErrorIntegration - HTTP 错误捕获（Fetch/XHR，脱敏）
 * 5. ResourceErrorIntegration - 资源加载错误（img/script/link/video/audio）
 * 6. PerformanceIntegration - 请求性能监控（慢请求阈值3秒）
 * 7. BreadcrumbIntegration - 用户行为轨迹（自动捕获 console/DOM/fetch/XHR/history）
 * 8. SessionReplayIntegration - 会话录制（rrweb，错误时录制）
 *
 * ✅ 增强功能 Integrations (2个)：
 * 9. SamplingIntegration - 分层采样（错误100%，性能100% Demo模式）
 * 10. DeduplicationIntegration - 错误去重（5秒窗口）
 *
 * ✅ 性能监控 Integrations (1个)：
 * 11. ResourceTimingIntegration - 资源性能详细监控（DNS/TCP/TTFB/Download）
 *
 * 🎯 手动功能：
 * - addBreadcrumb() - 手动添加面包屑
 * - setUser() - 设置用户信息
 * - setTag() - 设置标签
 * - configureScope() - 配置作用域
 */

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
    apiBaseUrl: 'http://localhost:8081/api',
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
                    captureResourceErrors: true,
                    collectDeviceInfo: true,
                    collectNetworkInfo: true,
                    enableDeduplication: true,
                }),

                // 2. Metrics - Core Web Vitals
                new Metrics(),

                // 3. SessionIntegration - 会话跟踪
                new SessionIntegration({
                    sessionTimeout: 30 * 60 * 1000, // 30 分钟无活动则结束会话
                }),

                // P2: 性能打点 - 接口耗时监控
                new PerformanceIntegration({
                    traceFetch: true,
                    traceXHR: true,
                    slowRequestThreshold: 3000, // 3秒慢请求阈值
                    traceAllRequests: false, // 只上报慢请求和失败请求
                }),

                // 4. HttpErrorIntegration - HTTP 错误捕获
                new HttpErrorIntegration({
                    captureSuccessfulRequests: false, // 只捕获失败请求
                    captureHeaders: true, // 捕获请求头（会自动脱敏）
                    captureBody: false, // 不捕获请求体（避免敏感数据）
                    enableDeduplication: true, // 启用去重
                }),

                // 5. ResourceErrorIntegration - 资源加载错误
                new ResourceErrorIntegration({
                    captureConsole: true, // 在控制台输出错误
                    enableDeduplication: true, // 启用去重
                }),

                // 6. BreadcrumbIntegration - 用户行为轨迹追踪（自动捕获）
                new BreadcrumbIntegration({
                    console: true, // 捕获 console 日志
                    dom: true, // 捕获 DOM 点击事件
                    fetch: true, // 捕获 Fetch 请求
                    history: true, // 捕获路由变化
                    xhr: true, // 捕获 XHR 请求
                    input: false, // 不捕获输入（隐私考虑）
                }),

                // 7. SessionReplayIntegration - 会话录制（rrweb）
                new SessionReplayIntegration({
                    mode: 'onError', // 错误时录制
                    maskAllInputs: true, // 脱敏所有输入
                    bufferDuration: 60, // 缓冲60秒
                    afterErrorDuration: 10, // 错误后继续录制10秒
                    recordCanvas: false, // 不录制Canvas（性能考虑）
                }),

                // 8. SamplingIntegration - 分层采样
                new SamplingIntegration({
                    errorSampleRate: 1.0, // 错误 100% 采样
                    performanceSampleRate: 1.0, // Demo 模式：性能 100% 采样
                }),

                // 9. DeduplicationIntegration - 错误去重
                new DeduplicationIntegration({
                    maxCacheSize: 100,
                    timeWindow: 5000, // 5秒内相同错误只记录一次
                }),

                // 10. ResourceTimingIntegration - 资源性能详细监控
                new ResourceTimingIntegration({
                    slowThreshold: 3000, // 慢资源阈值 3秒
                    reportAllResources: false, // 只上报慢资源
                    reportSummary: true, // 上报摘要统计
                    enableObserver: true, // 启用实时监听（SPA）
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

        // 设置用户上下文（Demo 测试）
        setUser({
            id: 'demo_user_123',
            username: 'demo_user',
            email: 'demo@skymonitor.com',
        })

        // 设置标签
        setTag('demo', 'true')
        setTag('environment', CONFIG.environment)
        setTag('test_suite', 'integration_tests')

        // 添加初始面包屑
        addBreadcrumb({
            message: 'Sky Monitor SDK initialized',
            category: 'lifecycle',
            level: 'info',
        })

        console.log('✅ Sky Monitor SDK 初始化成功')
        console.log('📊 已启用的 11 个 Integrations:')
        console.log('  ✓ 1. Errors - 全局错误捕获')
        console.log('  ✓ 2. Metrics - Core Web Vitals (LCP, FCP, CLS, TTFB)')
        console.log('  ✓ 3. SessionIntegration - 会话跟踪（30分钟超时）')
        console.log('  ✓ 4. HttpErrorIntegration - HTTP 错误捕获（Fetch/XHR）')
        console.log('  ✓ 5. ResourceErrorIntegration - 资源加载错误')
        console.log('  ✓ 6. BreadcrumbIntegration - 用户行为轨迹自动追踪')
        console.log('  ✓ 7. SessionReplayIntegration - 会话录制（rrweb）')
        console.log('  ✓ 8. SamplingIntegration - 分层采样（100% Demo模式）')
        console.log('  ✓ 9. DeduplicationIntegration - 错误去重（5秒窗口）')
        console.log('  ✓ 10. PerformanceIntegration - 请求性能监控（慢请求>3秒）')
        console.log('  ✓ 11. ResourceTimingIntegration - 资源性能详细监控')
        console.log('')
        console.log('🔧 传输配置:')
        console.log('  ✓ 批量上报: 20条/次, 5秒刷新')
        console.log('  ✓ 离线队列: 50条, 10秒重试')
        console.log('  ✓ 全局采样率: 100%')
        console.log('')
        console.log('👤 用户上下文:')
        console.log('  ✓ User ID: demo_user_123')
        console.log('  ✓ Username: demo_user')
        console.log('  ✓ Tags: demo=true, environment=development')

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
