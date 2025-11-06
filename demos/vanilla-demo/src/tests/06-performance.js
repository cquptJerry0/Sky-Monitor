/**
 * 06-performance.js - PerformanceIntegration 测试
 *
 * 测试 PerformanceIntegration 的请求性能监控功能
 *
 * 测试场景 (6个)：
 * 1. 快速请求 (< 3s) - 不上报
 * 2. 慢速请求 (> 3s) - 上报
 * 3. 失败请求 - 上报
 * 4. 并发请求监控
 * 5. XHR性能监控
 * 6. Fetch性能监控
 *
 * 验证字段：
 * - perf_category: 'http'
 * - http_duration
 * - perf_is_slow
 * - perf_success
 */

export const PerformanceTests = {
    name: 'Performance Integration',
    description: '请求性能监控',
    scenarios: [
        {
            id: 'fast-request',
            name: '快速请求',
            description: '小于3秒的请求（不上报）',
            run: async () => {
                await fetch('https://httpstat.us/200?sleep=500')
                return 'Fast request (< 3s) - should NOT be reported'
            },
        },
        {
            id: 'slow-request',
            name: '慢速请求',
            description: '大于3秒的慢请求（上报）',
            run: async () => {
                try {
                    await fetch('https://httpstat.us/200?sleep=4000')
                } catch (e) {
                    // 可能超时
                }
                return 'Slow request (> 3s) - should be reported'
            },
        },
        {
            id: 'failed-request',
            name: '失败请求',
            description: '失败的请求（上报）',
            run: async () => {
                try {
                    await fetch('https://httpstat.us/500')
                } catch (e) {
                    // 忽略错误
                }
                return 'Failed request - should be reported'
            },
        },
        {
            id: 'concurrent-requests',
            name: '并发请求',
            description: '同时发起多个请求',
            run: async () => {
                const requests = [
                    fetch('https://httpstat.us/200?sleep=1000'),
                    fetch('https://httpstat.us/200?sleep=1500'),
                    fetch('https://httpstat.us/200?sleep=2000'),
                ]

                await Promise.allSettled(requests)
                return 'Concurrent requests completed'
            },
        },
        {
            id: 'xhr-performance',
            name: 'XHR性能监控',
            description: 'XMLHttpRequest性能监控',
            run: () => {
                return new Promise(resolve => {
                    const xhr = new XMLHttpRequest()
                    xhr.open('GET', 'https://httpstat.us/200?sleep=3500')
                    xhr.onloadend = () => resolve('XHR slow request (> 3s) completed')
                    xhr.onerror = () => resolve('XHR request failed')
                    xhr.send()

                    // 超时保护
                    setTimeout(() => resolve('XHR request timeout'), 5000)
                })
            },
        },
        {
            id: 'fetch-performance',
            name: 'Fetch性能监控',
            description: 'Fetch请求性能监控',
            run: async () => {
                const requests = [
                    { name: 'fast', url: 'https://httpstat.us/200?sleep=500' },
                    { name: 'slow', url: 'https://httpstat.us/200?sleep=3500' },
                ]

                for (const req of requests) {
                    try {
                        await fetch(req.url)
                    } catch (e) {
                        // 忽略错误
                    }
                    await new Promise(resolve => setTimeout(resolve, 500))
                }

                return 'Fetch performance monitoring: fast + slow requests'
            },
        },
    ],

    async runAll() {
        const results = []
        for (const scenario of this.scenarios) {
            try {
                const message = await scenario.run()
                results.push({
                    id: scenario.id,
                    name: scenario.name,
                    status: 'success',
                    message,
                    timestamp: new Date().toISOString(),
                })
                // 延迟避免请求过快
                await new Promise(resolve => setTimeout(resolve, 1000))
            } catch (error) {
                results.push({
                    id: scenario.id,
                    name: scenario.name,
                    status: 'error',
                    error: error.message,
                    timestamp: new Date().toISOString(),
                })
            }
        }
        return results
    },

    async runScenario(scenarioId) {
        const scenario = this.scenarios.find(s => s.id === scenarioId)
        if (!scenario) {
            throw new Error(`Scenario ${scenarioId} not found`)
        }

        try {
            const message = await scenario.run()
            return {
                id: scenario.id,
                name: scenario.name,
                status: 'success',
                message,
                timestamp: new Date().toISOString(),
            }
        } catch (error) {
            return {
                id: scenario.id,
                name: scenario.name,
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString(),
            }
        }
    },
}

export default PerformanceTests
