import {
    init,
    Errors,
    Metrics,
    SamplingIntegration,
    DeduplicationIntegration,
    SessionIntegration,
    PerformanceIntegration,
} from '@sky-monitor/monitor-sdk-browser'

// 初始化SDK
// 注意：将这里的appId替换为你从管理后台创建的实际应用ID
const APP_ID = 'vanillasx6GyT' // 示例appId，请替换为真实的

;(async () => {
    console.log('初始化 Sky Monitor SDK...')

    const monitoring = await init({
        dsn: `http://localhost:8080/api/monitoring/${APP_ID}`,

        integrations: [
            // P0: 错误去重 - 减少80%噪音数据
            new DeduplicationIntegration({
                maxCacheSize: 100,
                timeWindow: 5000, // 5秒内相同错误只记录一次
            }),

            // P2: 会话追踪 - 统计会话级指标
            new SessionIntegration({
                sessionTimeout: 30 * 60 * 1000, // 30分钟超时
            }),

            // P2: 性能打点 - 接口耗时监控
            new PerformanceIntegration({
                traceFetch: true,
                traceXHR: true,
                slowRequestThreshold: 3000, // 3秒慢请求阈值
                traceAllRequests: false, // 只上报慢请求和失败请求
            }),

            // 原有集成
            new Errors(),
            new SamplingIntegration({
                errorSampleRate: 1.0, // 错误100%采样
                performanceSampleRate: 0.3, // 性能30%采样
            }),
            new Metrics(),
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
    console.log('  - OfflineTransport (P1): LocalStorage降级，离线队列50条')
    console.log('  - Errors: 全局错误捕获')
    console.log('  - SamplingIntegration: 分层采样 (error:100%, perf:30%)')
    console.log('  - Metrics: Web Vitals 性能指标')

    // 导出monitoring实例供其他模块使用
    window.monitoring = monitoring

    // 页面加载完成后输出信息
    window.addEventListener('load', () => {
        console.log('页面加载完成')
        console.log('性能指标将自动收集并上报')
        console.log('所有 Fetch/XHR 请求将被监控')
    })
})()
