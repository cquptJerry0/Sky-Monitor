/**
 * 02-metrics.js - Metrics Integration 测试
 *
 * 测试 Metrics Integration 的 Core Web Vitals 监控功能
 *
 * 测试场景 (4个)：
 * 1. 触发LCP (Largest Contentful Paint) - 加载大图片
 * 2. 触发FCP (First Contentful Paint) - 首次内容渲染
 * 3. 触发CLS (Cumulative Layout Shift) - 布局偏移
 * 4. 触发TTFB (Time to First Byte) - 页面刷新
 *
 * 验证字段：
 * - event_type: 'webVital'
 * - event_name: 'LCP' | 'FCP' | 'CLS' | 'TTFB'
 * - perf_value
 * - path
 */

export const MetricsTests = {
    name: 'Metrics Integration',
    description: 'Core Web Vitals 监控',
    scenarios: [
        {
            id: 'trigger-lcp',
            name: '触发LCP',
            description: '加载大图片触发 Largest Contentful Paint',
            run: async () => {
                // 创建一个大图片元素
                const container = document.createElement('div')
                container.id = 'lcp-test-container'
                container.style.cssText = 'width: 800px; height: 600px; margin: 20px;'

                const img = document.createElement('img')
                img.src = 'https://picsum.photos/800/600?random=' + Date.now()
                img.style.cssText = 'width: 100%; height: 100%;'
                img.alt = 'LCP Test Image'

                container.appendChild(img)
                document.body.appendChild(container)

                // 等待图片加载
                await new Promise(resolve => {
                    img.onload = resolve
                    img.onerror = resolve
                    setTimeout(resolve, 3000) // 超时保护
                })

                // 清理
                setTimeout(() => container.remove(), 1000)

                return 'LCP should be triggered by large image load'
            },
        },
        {
            id: 'trigger-fcp',
            name: '触发FCP',
            description: '首次内容渲染（页面初始化时自动触发）',
            run: () => {
                // FCP 通常在页面加载时自动触发
                // 这里我们创建一些可见内容来确保触发
                const div = document.createElement('div')
                div.textContent = 'FCP Test - First Contentful Paint'
                div.style.cssText = 'font-size: 24px; padding: 20px; color: #333;'
                document.body.appendChild(div)

                setTimeout(() => div.remove(), 1000)

                return 'FCP should be triggered automatically on page load'
            },
        },
        {
            id: 'trigger-cls',
            name: '触发CLS',
            description: '布局偏移 - 动态插入内容导致布局变化',
            run: async () => {
                // 创建一个容器
                const container = document.createElement('div')
                container.id = 'cls-test-container'
                container.style.cssText = 'min-height: 100px; background: #f0f0f0; margin: 20px;'

                const staticContent = document.createElement('div')
                staticContent.textContent = 'Static content below'
                staticContent.style.cssText = 'padding: 20px; background: #e0e0e0;'

                document.body.appendChild(container)
                document.body.appendChild(staticContent)

                // 等待一帧
                await new Promise(resolve => requestAnimationFrame(resolve))

                // 动态插入大内容，导致下方元素移动
                const dynamicContent = document.createElement('div')
                dynamicContent.textContent = 'Dynamic content causing layout shift'
                dynamicContent.style.cssText = 'height: 300px; padding: 20px; background: #ffa500; margin: 20px 0;'
                container.appendChild(dynamicContent)

                // 等待CLS计算
                await new Promise(resolve => setTimeout(resolve, 500))

                // 清理
                setTimeout(() => {
                    container.remove()
                    staticContent.remove()
                }, 1000)

                return 'CLS should be triggered by dynamic content insertion'
            },
        },
        {
            id: 'trigger-ttfb',
            name: '触发TTFB',
            description: 'Time to First Byte（页面初始化时自动触发）',
            run: () => {
                // TTFB 在页面加载时自动触发
                // 可以通过 Navigation Timing API 获取
                if (performance && performance.timing) {
                    const ttfb = performance.timing.responseStart - performance.timing.requestStart
                    return `TTFB: ${ttfb}ms (automatically captured on page load)`
                }
                return 'TTFB should be triggered automatically on page load'
            },
        },
    ],

    /**
     * 运行所有测试场景
     */
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

    /**
     * 运行单个测试场景
     */
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

export default MetricsTests
