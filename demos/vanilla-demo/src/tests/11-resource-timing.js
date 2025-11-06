/**
 * 11-resource-timing.js - ResourceTimingIntegration 测试
 *
 * 测试 ResourceTimingIntegration 的资源性能详细监控功能
 *
 * 测试场景 (4个)：
 * 1. 慢资源识别 (> 3s)
 * 2. 资源摘要统计
 * 3. 实时监听 (SPA)
 * 4. DNS/TCP/TTFB分析
 *
 * 验证字段：
 * - perf_category: 'resourceTiming'
 * - isSlow
 * - summary 统计
 */

export const ResourceTimingTests = {
    name: 'ResourceTiming Integration',
    description: '资源性能详细监控',
    scenarios: [
        {
            id: 'slow-resource',
            name: '慢资源识别',
            description: '加载时间>3s的慢资源',
            run: async () => {
                // 加载一个慢速图片
                const img = new Image()
                img.src = 'https://httpstat.us/200?sleep=3500&random=' + Date.now()
                document.body.appendChild(img)

                await new Promise(resolve => {
                    img.onload = resolve
                    img.onerror = resolve
                    setTimeout(resolve, 5000)
                })

                img.remove()

                return 'Slow resource loaded (> 3s) - should be reported'
            },
        },
        {
            id: 'resource-summary',
            name: '资源摘要统计',
            description: '验证资源摘要统计上报',
            run: async () => {
                // 加载多种资源
                const resources = []

                // 图片
                const img = new Image()
                img.src = 'https://picsum.photos/100/100?random=' + Date.now()
                resources.push(img)

                // 脚本
                const script = document.createElement('script')
                script.src = 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js'
                resources.push(script)

                // 样式
                const link = document.createElement('link')
                link.rel = 'stylesheet'
                link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
                resources.push(link)

                resources.forEach(r => document.body.appendChild(r) || document.head.appendChild(r))

                await new Promise(resolve => setTimeout(resolve, 3000))

                resources.forEach(r => r.remove && r.remove())

                return 'Resource summary test - multiple resources loaded'
            },
        },
        {
            id: 'realtime-observer',
            name: '实时监听',
            description: 'PerformanceObserver实时监听（SPA）',
            run: async () => {
                // 动态加载资源，触发实时监听
                for (let i = 0; i < 3; i++) {
                    const img = new Image()
                    img.src = `https://picsum.photos/50/50?random=${Date.now()}_${i}`
                    document.body.appendChild(img)

                    await new Promise(resolve => setTimeout(resolve, 500))
                    img.remove()
                }

                return 'Realtime observer test - dynamically loaded resources'
            },
        },
        {
            id: 'timing-breakdown',
            name: 'Timing分析',
            description: '验证DNS/TCP/TTFB/Download详细时序',
            run: async () => {
                // 加载外部资源以获取完整时序
                const img = new Image()
                img.src = 'https://picsum.photos/200/200?random=' + Date.now()
                document.body.appendChild(img)

                await new Promise(resolve => {
                    img.onload = () => {
                        // 检查 PerformanceResourceTiming
                        const entries = performance.getEntriesByType('resource')
                        const entry = entries[entries.length - 1]

                        if (entry) {
                            const timing = {
                                dns: entry.domainLookupEnd - entry.domainLookupStart,
                                tcp: entry.connectEnd - entry.connectStart,
                                ttfb: entry.responseStart - entry.requestStart,
                                download: entry.responseEnd - entry.responseStart,
                            }
                            resolve(
                                `Timing breakdown - DNS:${timing.dns}ms TCP:${timing.tcp}ms TTFB:${timing.ttfb}ms Download:${timing.download}ms`
                            )
                        } else {
                            resolve('Timing breakdown captured')
                        }

                        img.remove()
                    }
                    img.onerror = () => {
                        resolve('Timing breakdown - image load failed')
                        img.remove()
                    }
                    setTimeout(() => {
                        resolve('Timing breakdown - timeout')
                        img.remove()
                    }, 5000)
                })
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

export default ResourceTimingTests
