/**
 * Performance Integration 测试场景
 *
 * 功能：请求性能监控（Fetch/XHR）
 * 配置：traceFetch, traceXHR, slowRequestThreshold, traceAllRequests
 */

export const PerformanceIntegrationScenarios = {
    name: 'Performance Integration',
    integration: 'PerformanceIntegration',
    config: {
        traceFetch: true,
        traceXHR: true,
        slowRequestThreshold: 3000, // 3秒
        traceAllRequests: false, // 只上报慢请求和失败请求
    },
    scenarios: [
        {
            id: 'perf-01',
            name: '慢请求 (Fetch)',
            description: '测试超过3秒的请求被标记为慢请求',
            trigger: async () => {
                try {
                    // httpbin.org/delay/{seconds} 会延迟指定秒数后返回
                    await fetch('https://httpbin.org/delay/4')
                    console.log('[Performance] Slow fetch request completed')
                } catch (error) {
                    console.log('[Performance] Slow fetch request error:', error)
                }
            },
            expectedFields: ['type', 'category', 'url', 'method', 'status', 'duration', 'isSlow', 'success', 'timestamp'],
            expectedValues: {
                type: 'performance',
                category: 'http',
                method: 'GET',
                isSlow: true,
                success: true,
            },
            dsnEndpoint: '/api/monitoring/:appId/batch',
            backendQuery: '/api/performance/http?slow=true',
            frontendPage: '/performance',
        },
        {
            id: 'perf-02',
            name: '失败请求 (Fetch)',
            description: '测试失败的请求性能记录',
            trigger: async () => {
                try {
                    await fetch('https://httpbin.org/status/500')
                    console.log('[Performance] Failed fetch request completed')
                } catch (error) {
                    console.log('[Performance] Failed fetch request error:', error)
                }
            },
            expectedFields: ['type', 'category', 'url', 'method', 'status', 'duration', 'success', 'timestamp'],
            expectedValues: {
                type: 'performance',
                category: 'http',
                method: 'GET',
                status: 500,
                success: false,
            },
            dsnEndpoint: '/api/monitoring/:appId/batch',
            backendQuery: '/api/performance/http',
            frontendPage: '/performance',
        },
        {
            id: 'perf-03',
            name: '慢请求 (XHR)',
            description: '测试 XHR 慢请求',
            trigger: () => {
                const xhr = new XMLHttpRequest()
                xhr.open('GET', 'https://httpbin.org/delay/4')
                xhr.onloadend = () => {
                    console.log('[Performance] Slow XHR request completed')
                }
                xhr.send()
            },
            expectedFields: ['type', 'category', 'url', 'method', 'status', 'duration', 'isSlow', 'success', 'timestamp'],
            expectedValues: {
                type: 'performance',
                category: 'http',
                method: 'GET',
                isSlow: true,
                success: true,
            },
            dsnEndpoint: '/api/monitoring/:appId/batch',
            backendQuery: '/api/performance/http?slow=true',
            frontendPage: '/performance',
        },
    ],
}

/**
 * 运行所有 Performance 场景
 */
export function runPerformanceScenarios(onComplete) {
    console.log('[Performance Integration] Starting scenarios...')
    const scenarios = PerformanceIntegrationScenarios.scenarios

    let currentIndex = 0

    async function runNext() {
        if (currentIndex >= scenarios.length) {
            console.log('[Performance Integration] All scenarios completed')
            if (onComplete) onComplete()
            return
        }

        const scenario = scenarios[currentIndex]
        console.log(`[Performance Integration] Running: ${scenario.name}`)

        try {
            await scenario.trigger()
        } catch (error) {
            console.log(`[Performance Integration] ${scenario.name} error:`, error)
        }

        currentIndex++
        // 慢请求需要更长的间隔
        setTimeout(runNext, 5000)
    }

    runNext()
}
