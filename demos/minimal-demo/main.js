/**
 * Sky Monitor - 极简测试 Demo
 *
 * 目标：黑白简约布局 + 覆盖 SDK 所有功能 + 高 ROI 上报
 *
 * 覆盖的 11 个 Integration：
 * 1. Errors - 错误捕获
 * 2. Metrics - Core Web Vitals
 * 3. SessionIntegration - 会话跟踪
 * 4. HttpErrorIntegration - HTTP 错误
 * 5. ResourceErrorIntegration - 资源错误
 * 6. PerformanceIntegration - 性能监控
 * 7. BreadcrumbIntegration - 面包屑
 * 8. SessionReplayIntegration - 会话录制
 * 9. ResourceTimingIntegration - 资源性能
 * 10. SamplingIntegration - 采样
 * 11. DeduplicationIntegration - 去重
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
    captureEvent,
} from '@sky-monitor/monitor-sdk-browser'

// 配置
const APP_ID = 'vanilla6UmB9V'
const DSN = `http://localhost:8080/api/monitoring/${APP_ID}`

// 日志输出
const logToConsole = (message, type = 'info') => {
    const consoleEl = document.getElementById('console')
    const timestamp = new Date().toLocaleTimeString()
    const className = type === 'error' ? 'error' : type === 'success' ? 'success' : 'info'

    const line = document.createElement('div')
    line.innerHTML = `<span class="timestamp">[${timestamp}]</span><span class="${className}">${message}</span>`
    consoleEl.appendChild(line)
    consoleEl.scrollTop = consoleEl.scrollHeight
}

// 初始化 SDK
;(async () => {
    logToConsole('正在初始化 Sky Monitor SDK...', 'info')

    try {
        const monitoring = await init({
            dsn: DSN,
            appId: APP_ID,
            release: '1.0.0-minimal',
            environment: 'development',

            // 全部 11 个 Integrations
            integrations: [
                // 1. 错误捕获（立即上报）
                new Errors({
                    captureResourceErrors: true,
                    collectDeviceInfo: true,
                    collectNetworkInfo: true,
                }),

                // 2. Core Web Vitals（批量上报）
                new Metrics(),

                // 3. 会话跟踪（批量上报）
                new SessionIntegration({
                    sessionTimeout: 30 * 60 * 1000, // 30分钟
                }),

                // 4. HTTP 错误捕获（批量上报）
                new HttpErrorIntegration({
                    captureSuccessfulRequests: false,
                    captureHeaders: true,
                    captureBody: false,
                }),

                // 5. 资源加载错误（立即上报）
                new ResourceErrorIntegration(),

                // 6. 性能监控（批量上报）
                new PerformanceIntegration({
                    traceFetch: true,
                    traceXHR: true,
                    slowRequestThreshold: 3000,
                    traceAllRequests: false,
                }),

                // 7. 面包屑（延迟批量上报）
                new BreadcrumbIntegration({
                    console: true,
                    dom: true,
                    fetch: true,
                    history: true,
                    xhr: true,
                }),

                // 8. 会话录制（错误时录制）
                new SessionReplayIntegration({
                    recordOnError: true,
                    maxReplayDuration: 60000, // 60秒
                }),

                // 9. 资源性能详细监控（批量上报）
                new ResourceTimingIntegration(),

                // 10. 采样（细粒度配置）
                new SamplingIntegration({
                    // 错误类事件 - 100% 采样（不能丢失错误）
                    errorSampleRate: 1.0,
                    exceptionSampleRate: 1.0,
                    unhandledrejectionSampleRate: 1.0,

                    // 性能类事件 - 80% 采样（提高保留率）
                    performanceSampleRate: 0.8,
                    webVitalSampleRate: 0.8,

                    // 用户行为类事件 - 50% 采样（提高保留率）
                    breadcrumbSampleRate: 0.5,
                    messageSampleRate: 1.0,
                    transactionSampleRate: 0.8,
                    customSampleRate: 0.8,

                    // 默认采样率
                    defaultSampleRate: 1.0,
                }),

                // 11. 去重
                new DeduplicationIntegration({
                    maxCacheSize: 100,
                    timeWindow: 5000,
                }),
            ],

            // 启用分层传输（四个独立通道）
            enableLayeredTransport: true,

            // 分层传输配置
            layeredTransportConfig: {
                layers: {
                    // CRITICAL 通道 - 错误事件立即上报
                    critical: {
                        batchSize: 1,
                        flushInterval: 0,
                    },
                    // LARGE 通道 - 大数据单独上报（Session Replay）
                    large: {
                        batchSize: 1,
                        flushInterval: 10000,
                        compress: true,
                    },
                    // NORMAL 通道 - 标准批量上报（performance、message、custom）
                    normal: {
                        batchSize: 20,
                        flushInterval: 60000, // 60 秒
                    },
                    // AUXILIARY 通道 - 延迟批量上报（breadcrumb）
                    auxiliary: {
                        batchSize: 50,
                        flushInterval: 30000, // 30 秒
                    },
                },
            },

            // 离线队列
            enableOffline: true,
            offlineQueueSize: 50,
            retryInterval: 10000,
        })

        // 设置用户信息
        setUser({
            id: 'test_user_001',
            username: 'test_user',
            email: 'test@example.com',
        })

        // 设置标签
        setTag('demo', 'minimal')
        setTag('environment', 'development')

        // 导出到全局
        window.monitoring = monitoring

        logToConsole('SDK 初始化成功！', 'success')
        logToConsole(`DSN: ${DSN}`, 'info')
        logToConsole('已启用 11 个 Integration，覆盖 SDK 所有功能', 'success')
        logToConsole('分层传输已启用: CRITICAL(立即) | NORMAL(20条/60秒) | AUXILIARY(50条/30秒)', 'info')
        logToConsole('采样率: 错误 100% | 性能 80% | Message 100%', 'info')

        const statusEl = document.getElementById('status')
        statusEl.innerHTML = '<span class="status-dot"></span>已连接'
        statusEl.classList.add('connected')
    } catch (error) {
        logToConsole(`SDK 初始化失败: ${error.message}`, 'error')
        const statusEl = document.getElementById('status')
        statusEl.innerHTML = '<span class="status-dot"></span>连接失败'
        statusEl.style.background = 'rgba(239, 68, 68, 0.2)'
    }
})()

// ===== 测试函数 =====

// 1. 测试 Error（立即上报到 /critical）
window.testError = () => {
    logToConsole('触发 Error 测试...', 'info')
    try {
        throw new Error('这是一个测试错误 - 应立即上报到 /critical 端点')
    } catch (error) {
        // Error Integration 会自动捕获
        logToConsole('Error 已触发，应立即上报到 /critical 端点（CRITICAL 通道）', 'success')
    }
}

// 2. 测试 Promise Rejection（立即上报到 /critical）
window.testPromiseRejection = () => {
    logToConsole('触发 Promise Rejection 测试...', 'info')
    Promise.reject(new Error('这是一个未处理的 Promise 拒绝 - 应立即上报到 /critical 端点'))
    logToConsole('Promise Rejection 已触发，应立即上报到 /critical 端点（CRITICAL 通道）', 'success')
}

// 3. 测试 HTTP Error（立即上报到 /critical）
window.testHttpError = async () => {
    logToConsole('触发 HTTP Error 测试...', 'info')
    try {
        await fetch('http://localhost:8080/api/non-existent-endpoint')
    } catch (error) {
        // HttpErrorIntegration 会自动捕获
    }
    logToConsole('HTTP Error 已触发，应立即上报到 /critical 端点（CRITICAL 通道）', 'success')
}

// 4. 测试 Performance（批量上报到默认端点）
window.testPerformance = async () => {
    logToConsole('触发慢请求测试（模拟 3.5 秒延迟）...', 'info')

    // 创建一个慢请求（使用 delay API）
    const startTime = Date.now()
    try {
        await fetch('http://localhost:8080/api/monitoring/health')
        const duration = Date.now() - startTime
        logToConsole(`请求完成，耗时: ${duration}ms，应批量上报到默认端点（NORMAL 通道，20条/60秒）`, 'success')
    } catch (error) {
        logToConsole(`请求失败: ${error.message}`, 'error')
    }
}

// 5. 测试 Breadcrumb（仅存储，不主动上报）
window.testBreadcrumb = () => {
    logToConsole('添加 Breadcrumb 测试...', 'info')

    addBreadcrumb({
        message: '用户点击了测试按钮',
        category: 'ui.click',
        level: 'info',
        data: {
            button: 'testBreadcrumb',
            timestamp: Date.now(),
        },
    })

    addBreadcrumb({
        message: '用户执行了某个操作',
        category: 'user.action',
        level: 'info',
    })

    logToConsole('Breadcrumb 已添加到 Scope，将在下次错误时一起上报', 'success')
    logToConsole('注意：Breadcrumb 不会主动上报，只作为错误的上下文信息', 'info')
}

// 6. 测试批量上报（连续触发 20 个事件）
window.testBatch = async () => {
    logToConsole('开始批量上报测试（连续触发 20 个 message 事件）...', 'info')

    for (let i = 1; i <= 20; i++) {
        captureEvent({
            type: 'message',
            message: `批量测试事件 ${i}/20`,
            category: 'test.batch',
            level: 'info',
            data: { index: i },
            timestamp: new Date().toISOString(),
        })

        // 短暂延迟，避免浏览器限流
        await new Promise(resolve => setTimeout(resolve, 50))
    }

    logToConsole('已触发 20 个 message 事件，应触发批量上报（达到 batchSize=20）', 'success')
    logToConsole('请检查网络面板，应该看到一个 POST 请求到默认端点（NORMAL 通道）', 'info')
}

// 7. 测试资源加载错误（高 ROI：真实场景）
window.testResourceError = () => {
    logToConsole('触发资源加载错误...', 'info')
    const img = document.createElement('img')
    img.src = 'http://localhost:8080/non-existent-image.png'
    img.onerror = () => {
        logToConsole('资源错误已触发，应立即上报到 /critical 端点（CRITICAL 通道）', 'success')
    }
    document.body.appendChild(img)
    // 隐藏图片
    img.style.display = 'none'
}

// 8. 测试 Core Web Vitals（高 ROI：性能指标）
window.testWebVitals = () => {
    logToConsole('Core Web Vitals 已自动收集', 'info')
    logToConsole('LCP, FCP, CLS, TTFB 将在页面加载完成后上报', 'info')
    logToConsole('打开浏览器控制台查看详细指标', 'success')
}

// 9. 测试 Session Replay（高 ROI：错误复现）
window.testSessionReplay = () => {
    logToConsole('触发会话录制...', 'info')
    // 触发一个错误，自动开始录制
    setTimeout(() => {
        try {
            throw new Error('Session Replay 测试错误 - 应触发录制')
        } catch (error) {
            logToConsole('错误已触发，会话录制已启动（60秒）', 'success')
        }
    }, 100)
}

// 10. 测试用户上下文（高 ROI：错误定位）
window.testUserContext = () => {
    logToConsole('设置用户信息...', 'info')
    setUser({
        id: 'demo-user-001',
        email: 'demo@skymonitor.com',
        username: 'demo_user',
    })
    setTag('test_mode', 'minimal-demo')
    setTag('version', '1.0.0')
    setTag('environment', 'development')
    logToConsole('用户信息已设置，后续错误将关联用户', 'success')
}

// 11. 测试资源性能（高 ROI：性能优化）
window.testResourceTiming = async () => {
    logToConsole('加载测试资源...', 'info')
    const img = document.createElement('img')
    img.src = 'http://localhost:8080/logo.png?' + Date.now()
    img.onload = () => {
        logToConsole('资源加载完成，性能数据已收集（DNS/TCP/TTFB）', 'success')
        logToConsole('应批量上报到默认端点（NORMAL 通道，20条/60秒）', 'info')
    }
    img.onerror = () => {
        logToConsole('资源加载失败，但性能数据仍会收集', 'info')
    }
    document.body.appendChild(img)
    // 隐藏图片
    img.style.display = 'none'
}

// ===== 新增：Breadcrumb 自动采集测试 =====

// 12. 测试 Console Breadcrumb（自动采集 console 日志）
window.testConsoleBreadcrumb = () => {
    logToConsole('触发 Console Breadcrumb 测试...', 'info')

    // 触发不同级别的 console 输出
    console.log('这是一个 console.log 测试 - 应被 BreadcrumbIntegration 自动捕获')
    console.warn('这是一个 console.warn 测试 - 应被 BreadcrumbIntegration 自动捕获')
    console.error('这是一个 console.error 测试 - 应被 BreadcrumbIntegration 自动捕获')
    console.info('这是一个 console.info 测试 - 应被 BreadcrumbIntegration 自动捕获')

    logToConsole('已触发 4 个 console 输出，应自动记录为 Breadcrumb', 'success')
    logToConsole('Breadcrumb 将在下次错误时一起上报', 'info')
}

// 13. 测试 DOM Breadcrumb（自动采集点击事件）
window.testDOMBreadcrumb = () => {
    logToConsole('触发 DOM Breadcrumb 测试...', 'info')

    // 创建一个临时按钮并触发点击
    const testButton = document.createElement('button')
    testButton.id = 'test-dom-breadcrumb-button'
    testButton.textContent = '测试按钮（自动点击）'
    testButton.style.display = 'none'
    document.body.appendChild(testButton)

    // 模拟点击事件
    testButton.click()

    // 清理
    setTimeout(() => {
        document.body.removeChild(testButton)
    }, 100)

    logToConsole('已触发 DOM 点击事件，应自动记录为 Breadcrumb', 'success')
    logToConsole('Breadcrumb 将在下次错误时一起上报', 'info')
}

// 14. 测试 Fetch Breadcrumb（自动采集 Fetch 请求）
window.testFetchBreadcrumb = async () => {
    logToConsole('触发 Fetch Breadcrumb 测试...', 'info')

    try {
        // 发起一个成功的请求
        await fetch('http://localhost:8080/api/monitoring/health')
        logToConsole('Fetch 请求完成，应自动记录为 Breadcrumb', 'success')
    } catch (error) {
        logToConsole('Fetch 请求失败，但仍会记录为 Breadcrumb', 'info')
    }

    logToConsole('Breadcrumb 将在下次错误时一起上报', 'info')
}

// 15. 测试 History Breadcrumb（自动采集路由变化）
window.testHistoryBreadcrumb = () => {
    logToConsole('触发 History Breadcrumb 测试...', 'info')

    // 保存当前 URL
    const currentUrl = window.location.href

    // 模拟路由变化
    history.pushState({ page: 1 }, 'Test Page 1', '/test-page-1')
    logToConsole('路由变化 1: /test-page-1', 'success')

    setTimeout(() => {
        history.pushState({ page: 2 }, 'Test Page 2', '/test-page-2')
        logToConsole('路由变化 2: /test-page-2', 'success')

        // 恢复原始 URL
        setTimeout(() => {
            history.pushState(null, '', currentUrl)
            logToConsole('已恢复原始 URL', 'info')
            logToConsole('路由变化应自动记录为 Breadcrumb', 'success')
            logToConsole('Breadcrumb 将在下次错误时一起上报', 'info')
        }, 500)
    }, 500)
}

// 16. 测试 XHR Breadcrumb（自动采集 XMLHttpRequest）
window.testXHRBreadcrumb = () => {
    logToConsole('触发 XHR Breadcrumb 测试...', 'info')

    const xhr = new XMLHttpRequest()
    xhr.open('GET', 'http://localhost:8080/api/monitoring/health')

    xhr.onload = () => {
        logToConsole('XHR 请求完成，应自动记录为 Breadcrumb', 'success')
        logToConsole('Breadcrumb 将在下次错误时一起上报', 'info')
    }

    xhr.onerror = () => {
        logToConsole('XHR 请求失败，但仍会记录为 Breadcrumb', 'info')
    }

    xhr.send()
}

// 17. 测试完整的 Breadcrumb 流程（触发错误查看所有 Breadcrumb）
window.testBreadcrumbFlow = () => {
    logToConsole('开始完整的 Breadcrumb 流程测试...', 'info')

    // 1. Console
    console.log('步骤 1: Console 日志')

    // 2. DOM 点击
    const btn = document.createElement('button')
    btn.textContent = '测试'
    btn.style.display = 'none'
    document.body.appendChild(btn)
    btn.click()
    document.body.removeChild(btn)
    logToConsole('步骤 2: DOM 点击完成', 'info')

    // 3. Fetch 请求
    fetch('http://localhost:8080/api/monitoring/health')
        .then(() => {
            logToConsole('步骤 3: Fetch 请求完成', 'info')

            // 4. 路由变化
            const currentUrl = window.location.href
            history.pushState({ test: true }, 'Test', '/breadcrumb-test')
            logToConsole('步骤 4: 路由变化完成', 'info')

            // 5. 触发错误，查看所有 Breadcrumb
            setTimeout(() => {
                history.pushState(null, '', currentUrl)
                logToConsole('准备触发错误，查看完整的 Breadcrumb 轨迹...', 'info')

                setTimeout(() => {
                    try {
                        throw new Error('Breadcrumb 流程测试错误 - 查看错误详情中的 Breadcrumb 轨迹')
                    } catch (error) {
                        logToConsole('错误已触发，包含完整的 Breadcrumb 轨迹', 'success')
                        logToConsole('打开浏览器控制台或后端查看 Breadcrumb 详情', 'info')
                    }
                }, 500)
            }, 500)
        })
        .catch(() => {
            logToConsole('Fetch 请求失败', 'error')
        })
}

// 监听网络请求（用于调试）
if (window.PerformanceObserver) {
    const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
            if (entry.name.includes('/api/monitoring/')) {
                const url = new URL(entry.name)
                const endpoint = url.pathname.split('/').pop()
                logToConsole(`上报请求: ${endpoint} (${entry.duration.toFixed(0)}ms)`, 'info')
            }
        }
    })
    observer.observe({ entryTypes: ['resource'] })
}
