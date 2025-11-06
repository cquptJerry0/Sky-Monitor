/**
 * Integration 6: PerformanceIntegration - 请求性能监控测试
 *
 * 测试场景：
 * 1. 快速请求（< 3s）- 不上报
 * 2. 慢速请求（> 3s）- 上报
 * 3. 失败请求（任何耗时）- 上报
 * 4. 并发请求性能监控
 * 5. XHR 性能监控
 * 6. Fetch 性能监控
 *
 * 验证点：
 * - perf_category: 'http'
 * - http_duration 正确
 * - perf_is_slow 标记正确
 * - perf_success 标记正确
 * - 只有慢请求和失败请求上报
 */

import { addBreadcrumb } from '@sky-monitor/monitor-sdk-browser'

const TEST_API_BASE = 'https://httpstat.us'

export const PerformanceTests = {
    name: 'Performance Integration',
    totalTests: 6,
    tests: [
        {
            id: 'performance-01',
            name: '快速请求（不上报）',
            description: '测试快速请求（< 3s）不会被上报',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：快速请求',
                    category: 'test',
                    level: 'info',
                })

                try {
                    await fetch(`${TEST_API_BASE}/200`)
                } catch (error) {
                    // 忽略错误
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>快速请求测试</h3>
                        <p>已发送快速请求（< 3秒）</p>
                        <p>配置: traceAllRequests = false</p>
                        <p>预期: 该请求不会被上报到性能监控</p>
                        <p>查看后端验证没有对应的性能事件</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: [],
            shouldNotReport: true,
            timeout: 5000,
        },
        {
            id: 'performance-02',
            name: '慢速请求（上报）',
            description: '测试慢速请求（> 3s）会被上报',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：慢速请求',
                    category: 'test',
                    level: 'info',
                })

                const startTime = Date.now()
                try {
                    await fetch(`${TEST_API_BASE}/200?sleep=4000`)
                } catch (error) {
                    // 可能超时
                }
                const duration = Date.now() - startTime

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>慢速请求测试</h3>
                        <p>请求耗时: ${Math.round(duration)}ms</p>
                        <p>慢请求阈值: 3000ms</p>
                        <p>预期: 该请求会被上报（perf_is_slow = true）</p>
                        <p>查看后端验证性能事件</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['perf_category', 'http_duration', 'perf_is_slow', 'perf_success'],
            timeout: 10000,
        },
        {
            id: 'performance-03',
            name: '失败请求（上报）',
            description: '测试失败请求（任何耗时）会被上报',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：失败请求',
                    category: 'test',
                    level: 'info',
                })

                const startTime = Date.now()
                try {
                    await fetch(`${TEST_API_BASE}/500`)
                } catch (error) {
                    // 预期失败
                }
                const duration = Date.now() - startTime

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>失败请求测试</h3>
                        <p>请求耗时: ${Math.round(duration)}ms</p>
                        <p>HTTP 状态: 500</p>
                        <p>预期: 失败请求无论耗时都上报（perf_success = false）</p>
                        <p>查看后端验证性能事件</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['perf_category', 'http_duration', 'perf_success'],
            timeout: 5000,
        },
        {
            id: 'performance-04',
            name: '并发请求监控',
            description: '测试并发请求的性能监控',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：并发请求',
                    category: 'test',
                    level: 'info',
                })

                const startTime = Date.now()

                // 并发发送 3 个请求
                const promises = [
                    fetch(`${TEST_API_BASE}/200?sleep=3500`).catch(() => {}),
                    fetch(`${TEST_API_BASE}/200?sleep=4000`).catch(() => {}),
                    fetch(`${TEST_API_BASE}/500`).catch(() => {}),
                ]

                await Promise.all(promises)
                const totalDuration = Date.now() - startTime

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>并发请求测试</h3>
                        <p>已发送 3 个并发请求</p>
                        <p>总耗时: ${Math.round(totalDuration)}ms</p>
                        <p>请求 1: 慢速（3.5s）</p>
                        <p>请求 2: 慢速（4s）</p>
                        <p>请求 3: 失败（500）</p>
                        <p>预期: 上报 3 个性能事件</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['perf_category', 'http_duration'],
            timeout: 10000,
        },
        {
            id: 'performance-05',
            name: 'XHR 性能监控',
            description: '测试 XMLHttpRequest 的性能监控',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：XHR 性能',
                    category: 'test',
                    level: 'info',
                })

                return new Promise(resolve => {
                    const startTime = Date.now()
                    const xhr = new XMLHttpRequest()

                    xhr.open('GET', `${TEST_API_BASE}/200?sleep=3500`)
                    xhr.onloadend = () => {
                        const duration = Date.now() - startTime

                        const container = document.getElementById('test-area')
                        if (container) {
                            container.innerHTML = `
                                <h3>XHR 性能监控测试</h3>
                                <p>XHR 请求耗时: ${Math.round(duration)}ms</p>
                                <p>慢请求阈值: 3000ms</p>
                                <p>预期: 该 XHR 请求会被上报</p>
                            `
                        }

                        setTimeout(resolve, 500)
                    }
                    xhr.onerror = () => {
                        setTimeout(resolve, 500)
                    }
                    xhr.send()
                })
            },
            expectedFields: ['perf_category', 'http_duration', 'perf_is_slow'],
            timeout: 10000,
        },
        {
            id: 'performance-06',
            name: 'Fetch 性能监控',
            description: '测试 Fetch API 的性能监控',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：Fetch 性能',
                    category: 'test',
                    level: 'info',
                })

                const startTime = Date.now()
                try {
                    await fetch(`${TEST_API_BASE}/200?sleep=3500`)
                } catch (error) {
                    // 可能超时
                }
                const duration = Date.now() - startTime

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>Fetch 性能监控测试</h3>
                        <p>Fetch 请求耗时: ${Math.round(duration)}ms</p>
                        <p>慢请求阈值: 3000ms</p>
                        <p>预期: 该 Fetch 请求会被上报</p>
                        <p>查看后端验证性能事件包含正确的 http_method 和 http_url</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['perf_category', 'http_duration', 'perf_is_slow', 'http_method', 'http_url'],
            timeout: 10000,
        },
    ],
}

// 导出单独的测试函数
export function testFastRequest() {
    return PerformanceTests.tests[0].run()
}

export function testSlowRequest() {
    return PerformanceTests.tests[1].run()
}

export function testFailedRequest() {
    return PerformanceTests.tests[2].run()
}

export function testConcurrentRequests() {
    return PerformanceTests.tests[3].run()
}

export function testXHRPerformance() {
    return PerformanceTests.tests[4].run()
}

export function testFetchPerformance() {
    return PerformanceTests.tests[5].run()
}

// 运行所有性能测试
export async function runAllPerformanceTests() {
    const results = []

    for (const test of PerformanceTests.tests) {
        try {
            await test.run()
            results.push({ id: test.id, name: test.name, status: 'passed' })
        } catch (error) {
            results.push({ id: test.id, name: test.name, status: 'failed', error: error.message })
        }
    }

    return results
}
