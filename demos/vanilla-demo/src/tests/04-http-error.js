/**
 * Integration 4: HttpErrorIntegration - HTTP 错误捕获测试
 *
 * 测试场景：
 * 1. Fetch 404 错误
 * 2. Fetch 500 错误
 * 3. Fetch 网络超时
 * 4. Fetch 请求取消
 * 5. XHR 404 错误
 * 6. XHR 500 错误
 * 7. XHR 网络错误
 * 8. 请求头捕获和脱敏验证
 * 9. 错误去重验证
 *
 * 验证点：
 * - http_url 正确
 * - http_method 正确
 * - http_status 正确
 * - http_duration 记录
 * - error_fingerprint 生成
 * - requestHeaders 脱敏（Authorization）
 */

import { addBreadcrumb } from '@sky-monitor/monitor-sdk-browser'

const TEST_API_BASE = 'https://httpstat.us'

export const HttpErrorTests = {
    name: 'HttpError Integration',
    totalTests: 9,
    tests: [
        {
            id: 'http-error-01',
            name: 'Fetch 404 错误',
            description: '测试 Fetch API 的 404 状态码捕获',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：Fetch 404',
                    category: 'test',
                    level: 'info',
                })

                try {
                    await fetch(`${TEST_API_BASE}/404`)
                } catch (error) {
                    // 可能会抛出网络错误
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['http_url', 'http_method', 'http_status', 'http_duration'],
            timeout: 5000,
        },
        {
            id: 'http-error-02',
            name: 'Fetch 500 错误',
            description: '测试 Fetch API 的 500 状态码捕获',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：Fetch 500',
                    category: 'test',
                    level: 'info',
                })

                try {
                    await fetch(`${TEST_API_BASE}/500`)
                } catch (error) {
                    // 可能会抛出网络错误
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['http_url', 'http_method', 'http_status', 'http_duration'],
            timeout: 5000,
        },
        {
            id: 'http-error-03',
            name: 'Fetch 网络超时',
            description: '测试 Fetch 请求超时',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：Fetch 超时',
                    category: 'test',
                    level: 'info',
                })

                try {
                    const controller = new AbortController()
                    const timeoutId = setTimeout(() => controller.abort(), 1000)

                    await fetch(`${TEST_API_BASE}/200?sleep=5000`, {
                        signal: controller.signal,
                    })

                    clearTimeout(timeoutId)
                } catch (error) {
                    // 预期会超时
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['http_url', 'http_method', 'error_message'],
            timeout: 3000,
        },
        {
            id: 'http-error-04',
            name: 'Fetch 请求取消',
            description: '测试 Fetch 请求中止',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：Fetch 取消',
                    category: 'test',
                    level: 'info',
                })

                try {
                    const controller = new AbortController()

                    // 立即取消请求
                    setTimeout(() => controller.abort(), 100)

                    await fetch(`${TEST_API_BASE}/200?sleep=2000`, {
                        signal: controller.signal,
                    })
                } catch (error) {
                    // 预期会被取消
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['http_url', 'http_method', 'error_message'],
            timeout: 3000,
        },
        {
            id: 'http-error-05',
            name: 'XHR 404 错误',
            description: '测试 XMLHttpRequest 的 404 状态码',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：XHR 404',
                    category: 'test',
                    level: 'info',
                })

                return new Promise(resolve => {
                    const xhr = new XMLHttpRequest()
                    xhr.open('GET', `${TEST_API_BASE}/404`)
                    xhr.onloadend = () => {
                        setTimeout(resolve, 500)
                    }
                    xhr.onerror = () => {
                        setTimeout(resolve, 500)
                    }
                    xhr.send()
                })
            },
            expectedFields: ['http_url', 'http_method', 'http_status'],
            timeout: 5000,
        },
        {
            id: 'http-error-06',
            name: 'XHR 500 错误',
            description: '测试 XMLHttpRequest 的 500 状态码',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：XHR 500',
                    category: 'test',
                    level: 'info',
                })

                return new Promise(resolve => {
                    const xhr = new XMLHttpRequest()
                    xhr.open('POST', `${TEST_API_BASE}/500`)
                    xhr.onloadend = () => {
                        setTimeout(resolve, 500)
                    }
                    xhr.onerror = () => {
                        setTimeout(resolve, 500)
                    }
                    xhr.send(JSON.stringify({ test: 'data' }))
                })
            },
            expectedFields: ['http_url', 'http_method', 'http_status'],
            timeout: 5000,
        },
        {
            id: 'http-error-07',
            name: 'XHR 网络错误',
            description: '测试 XMLHttpRequest 网络错误',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：XHR 网络错误',
                    category: 'test',
                    level: 'info',
                })

                return new Promise(resolve => {
                    const xhr = new XMLHttpRequest()
                    xhr.open('GET', 'https://nonexistent-domain-test-12345.com/api')
                    xhr.timeout = 2000
                    xhr.ontimeout = () => {
                        setTimeout(resolve, 500)
                    }
                    xhr.onerror = () => {
                        setTimeout(resolve, 500)
                    }
                    xhr.onloadend = () => {
                        setTimeout(resolve, 500)
                    }
                    xhr.send()
                })
            },
            expectedFields: ['http_url', 'http_method', 'error_message'],
            timeout: 5000,
        },
        {
            id: 'http-error-08',
            name: '请求头捕获和脱敏',
            description: '验证敏感请求头（如 Authorization）被脱敏',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：请求头脱敏',
                    category: 'test',
                    level: 'info',
                })

                try {
                    await fetch(`${TEST_API_BASE}/404`, {
                        headers: {
                            Authorization: 'Bearer secret-token-12345',
                            'X-Custom-Header': 'CustomValue',
                        },
                    })
                } catch (error) {
                    // 忽略错误
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>请求头脱敏测试</h3>
                        <p>已发送包含 Authorization header 的请求</p>
                        <p>SDK 应该脱敏敏感信息：</p>
                        <ul>
                            <li>Authorization: Bearer secret-token-12345 → ******</li>
                            <li>X-Custom-Header: CustomValue → 保留</li>
                        </ul>
                        <p>查看后端数据验证脱敏是否生效</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['http_url', 'requestHeaders'],
            expectedSanitization: true,
            timeout: 5000,
        },
        {
            id: 'http-error-09',
            name: 'HTTP 错误去重',
            description: '测试相同 HTTP 错误的去重',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：HTTP 错误去重',
                    category: 'test',
                    level: 'info',
                })

                // 连续发送 3 个相同的失败请求
                for (let i = 0; i < 3; i++) {
                    try {
                        await fetch(`${TEST_API_BASE}/404`)
                    } catch (error) {
                        // 忽略错误
                    }
                    await new Promise(resolve => setTimeout(resolve, 200))
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>HTTP 错误去重测试</h3>
                        <p>已连续发送 3 个相同的 404 请求</p>
                        <p>去重机制应该生效（5秒窗口）</p>
                        <p>预期: 只上报 1 次，dedup_count = 3</p>
                        <p>查看后端数据验证去重是否生效</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['http_url', 'http_status', 'error_fingerprint'],
            expectedDedup: true,
            timeout: 5000,
        },
    ],
}

// 导出单独的测试函数
export function testFetch404() {
    return HttpErrorTests.tests[0].run()
}

export function testFetch500() {
    return HttpErrorTests.tests[1].run()
}

export function testFetchTimeout() {
    return HttpErrorTests.tests[2].run()
}

export function testFetchAbort() {
    return HttpErrorTests.tests[3].run()
}

export function testXHR404() {
    return HttpErrorTests.tests[4].run()
}

export function testXHR500() {
    return HttpErrorTests.tests[5].run()
}

export function testXHRNetworkError() {
    return HttpErrorTests.tests[6].run()
}

export function testHeaderSanitization() {
    return HttpErrorTests.tests[7].run()
}

export function testHttpErrorDedup() {
    return HttpErrorTests.tests[8].run()
}

// 运行所有 HTTP 错误测试
export async function runAllHttpErrorTests() {
    const results = []

    for (const test of HttpErrorTests.tests) {
        try {
            await test.run()
            results.push({ id: test.id, name: test.name, status: 'passed' })
        } catch (error) {
            results.push({ id: test.id, name: test.name, status: 'failed', error: error.message })
        }
    }

    return results
}
