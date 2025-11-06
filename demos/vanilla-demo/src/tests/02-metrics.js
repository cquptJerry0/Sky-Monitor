/**
 * Integration 2: Metrics - Core Web Vitals 测试
 *
 * 测试场景：
 * 1. 触发 LCP（加载大图片）
 * 2. 触发 FCP（首次内容渲染）
 * 3. 触发 CLS（布局偏移）
 * 4. 触发 TTFB（页面刷新）
 *
 * 验证点：
 * - event_type: 'webVital'
 * - event_name: 'LCP'|'FCP'|'CLS'|'TTFB'
 * - perf_value 数值正确
 * - path 字段记录
 */

import { addBreadcrumb } from '@sky-monitor/monitor-sdk-browser'

export const MetricsTests = {
    name: 'Metrics Integration',
    totalTests: 4,
    tests: [
        {
            id: 'metrics-01',
            name: 'LCP (Largest Contentful Paint)',
            description: '测试最大内容绘制时间',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：LCP',
                    category: 'test',
                    level: 'info',
                })

                // LCP 会在页面加载时自动捕获
                // 创建一个大图片来触发 LCP
                const img = new Image()
                img.src = 'https://via.placeholder.com/1920x1080/667eea/ffffff?text=LCP+Test+Image'
                img.style.cssText = 'width: 100%; max-width: 600px; height: auto;'

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = ''
                    container.appendChild(img)
                }

                // 等待图片加载完成
                await new Promise(resolve => {
                    img.onload = resolve
                    img.onerror = resolve
                    setTimeout(resolve, 3000)
                })
            },
            expectedFields: ['event_type', 'event_name', 'perf_value', 'path'],
            timeout: 5000,
        },
        {
            id: 'metrics-02',
            name: 'FCP (First Contentful Paint)',
            description: '测试首次内容绘制时间',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：FCP',
                    category: 'test',
                    level: 'info',
                })

                // FCP 在页面加载时自动捕获
                // 这里我们只是记录一个标记
                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = '<h3>FCP 会在页面首次渲染时自动捕获</h3><p>此指标反映页面首次渲染任何内容的时间</p>'
                }

                // 等待一段时间让指标被收集
                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            expectedFields: ['event_type', 'event_name', 'perf_value'],
            timeout: 3000,
        },
        {
            id: 'metrics-03',
            name: 'CLS (Cumulative Layout Shift)',
            description: '测试累积布局偏移',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：CLS',
                    category: 'test',
                    level: 'info',
                })

                const container = document.getElementById('test-area')
                if (container) {
                    // 创建一个会导致布局偏移的元素
                    const div = document.createElement('div')
                    div.style.cssText =
                        'width: 100%; height: 100px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin-top: 20px; transition: margin-top 0.3s;'
                    div.innerHTML = '<p style="color: white; padding: 20px;">观察布局变化...</p>'

                    container.innerHTML = ''
                    container.appendChild(div)

                    // 延迟后改变布局
                    await new Promise(resolve => setTimeout(resolve, 100))
                    div.style.marginTop = '100px'

                    await new Promise(resolve => setTimeout(resolve, 500))
                    div.style.marginTop = '200px'

                    // 等待 CLS 指标被收集
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }
            },
            expectedFields: ['event_type', 'event_name', 'perf_value'],
            timeout: 3000,
        },
        {
            id: 'metrics-04',
            name: 'TTFB (Time to First Byte)',
            description: '测试首字节时间',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：TTFB',
                    category: 'test',
                    level: 'info',
                })

                // TTFB 在页面加载时自动捕获
                // 显示说明信息
                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML =
                        '<h3>TTFB 在页面加载时自动捕获</h3><p>此指标反映从请求发出到收到响应首字节的时间</p><p>刷新页面可以看到新的 TTFB 值</p>'
                }

                // 等待一段时间
                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            expectedFields: ['event_type', 'event_name', 'perf_value'],
            timeout: 3000,
        },
    ],
}

// 导出单独的测试函数
export function testLCP() {
    return MetricsTests.tests[0].run()
}

export function testFCP() {
    return MetricsTests.tests[1].run()
}

export function testCLS() {
    return MetricsTests.tests[2].run()
}

export function testTTFB() {
    return MetricsTests.tests[3].run()
}

// 运行所有 Web Vitals 测试
export async function runAllMetricsTests() {
    const results = []

    for (const test of MetricsTests.tests) {
        try {
            await test.run()
            results.push({ id: test.id, name: test.name, status: 'passed' })
        } catch (error) {
            results.push({ id: test.id, name: test.name, status: 'failed', error: error.message })
        }
    }

    return results
}
