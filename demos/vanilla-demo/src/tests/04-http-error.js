/**
 * 04-http-error.js - HttpErrorIntegration 测试
 *
 * 测试 HttpErrorIntegration 的 HTTP 错误捕获功能
 *
 * 测试场景 (9个)：
 * 1. Fetch 404
 * 2. Fetch 500
 * 3. Fetch 超时
 * 4. Fetch 取消
 * 5. XHR 404
 * 6. XHR 500
 * 7. XHR 网络错误
 * 8. 请求头脱敏
 * 9. 错误去重
 *
 * 验证字段：
 * - http_url
 * - http_method
 * - http_status
 * - http_duration
 * - requestHeaders (脱敏)
 */

export const HttpErrorTests = {
    name: 'HttpError Integration',
    description: 'HTTP 错误捕获',
    scenarios: [
        {
            id: 'fetch-404',
            name: 'Fetch 404',
            description: 'Fetch请求返回404状态码',
            run: async () => {
                try {
                    await fetch('https://httpstat.us/404')
                } catch (e) {
                    // 网络错误
                }
                return 'Fetch 404 request sent'
            },
        },
        {
            id: 'fetch-500',
            name: 'Fetch 500',
            description: 'Fetch请求返回500状态码',
            run: async () => {
                try {
                    await fetch('https://httpstat.us/500')
                } catch (e) {
                    // 网络错误
                }
                return 'Fetch 500 request sent'
            },
        },
        {
            id: 'fetch-timeout',
            name: 'Fetch 超时',
            description: 'Fetch请求超时',
            run: async () => {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 100)

                try {
                    await fetch('https://httpstat.us/200?sleep=5000', {
                        signal: controller.signal,
                    })
                } catch (e) {
                    clearTimeout(timeoutId)
                    return 'Fetch timeout/abort triggered'
                }
                clearTimeout(timeoutId)
            },
        },
        {
            id: 'fetch-cancel',
            name: 'Fetch 取消',
            description: '主动取消Fetch请求',
            run: async () => {
                const controller = new AbortController()

                const fetchPromise = fetch('https://httpstat.us/200?sleep=3000', {
                    signal: controller.signal,
                }).catch(() => {})

                // 立即取消
                setTimeout(() => controller.abort(), 10)

                await fetchPromise
                return 'Fetch request cancelled'
            },
        },
        {
            id: 'xhr-404',
            name: 'XHR 404',
            description: 'XMLHttpRequest返回404',
            run: () => {
                return new Promise(resolve => {
                    const xhr = new XMLHttpRequest()
                    xhr.open('GET', 'https://httpstat.us/404')
                    xhr.onloadend = () => resolve('XHR 404 request sent')
                    xhr.send()
                })
            },
        },
        {
            id: 'xhr-500',
            name: 'XHR 500',
            description: 'XMLHttpRequest返回500',
            run: () => {
                return new Promise(resolve => {
                    const xhr = new XMLHttpRequest()
                    xhr.open('GET', 'https://httpstat.us/500')
                    xhr.onloadend = () => resolve('XHR 500 request sent')
                    xhr.send()
                })
            },
        },
        {
            id: 'xhr-network-error',
            name: 'XHR 网络错误',
            description: 'XHR网络错误',
            run: () => {
                return new Promise(resolve => {
                    const xhr = new XMLHttpRequest()
                    xhr.open('GET', 'https://nonexistent-domain-' + Date.now() + '.com/api')
                    xhr.onerror = () => resolve('XHR network error triggered')
                    xhr.ontimeout = () => resolve('XHR network error triggered')
                    xhr.onloadend = () => resolve('XHR network error request sent')
                    xhr.timeout = 1000
                    xhr.send()
                })
            },
        },
        {
            id: 'header-sanitization',
            name: '请求头脱敏',
            description: '验证敏感请求头被脱敏',
            run: async () => {
                try {
                    await fetch('https://httpstat.us/401', {
                        headers: {
                            Authorization: 'Bearer secret-token-12345',
                            Cookie: 'session_id=secret-session',
                            'X-API-Key': 'secret-api-key',
                            'Content-Type': 'application/json',
                        },
                    })
                } catch (e) {
                    // 忽略错误
                }
                return 'Request with sensitive headers sent - should be sanitized'
            },
        },
        {
            id: 'http-deduplication',
            name: 'HTTP错误去重',
            description: '5秒内相同HTTP错误去重',
            run: async () => {
                // 连续发送3个相同的404请求
                for (let i = 0; i < 3; i++) {
                    fetch('https://httpstat.us/404').catch(() => {})
                    await new Promise(resolve => setTimeout(resolve, 100))
                }
                return 'HTTP error deduplication test - 3 identical 404 requests'
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
                // 小延迟避免请求过快
                await new Promise(resolve => setTimeout(resolve, 500))
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

export default HttpErrorTests
