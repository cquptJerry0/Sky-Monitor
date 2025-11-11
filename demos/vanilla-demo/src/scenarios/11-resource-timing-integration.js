/**
 * ResourceTiming Integration 测试场景
 *
 * 功能：资源加载性能监控（DNS/TCP/TTFB/Download）
 * 配置：slowThreshold, reportAllResources, reportSummary, enableObserver
 */

export const ResourceTimingIntegrationScenarios = {
    name: 'ResourceTiming Integration',
    integration: 'ResourceTimingIntegration',
    config: {
        slowThreshold: 3000, // 3秒
        reportAllResources: false, // 只上报慢资源
        reportSummary: true,
        enableObserver: true, // 实时监听新资源 (SPA)
    },
    scenarios: [
        {
            id: 'timing-01',
            name: '慢资源监控',
            description: '测试加载超过3秒的资源被上报',
            trigger: () => {
                // 加载一个较大的图片
                const img = document.createElement('img')
                img.src = 'https://httpbin.org/delay/4' // 延迟4秒返回
                img.onload = () => {
                    console.log('[ResourceTiming] Slow resource loaded')
                    document.body.removeChild(img)
                }
                img.onerror = () => {
                    console.log('[ResourceTiming] Resource load error')
                    document.body.removeChild(img)
                }
                document.body.appendChild(img)
            },
            expectedFields: [
                'type',
                'category',
                'name',
                'metrics',
                'metrics.dns',
                'metrics.tcp',
                'metrics.ttfb',
                'metrics.download',
                'metrics.total',
                'timestamp',
            ],
            expectedValues: {
                type: 'performance',
                category: 'resource',
                'metrics.total': value => value > 3000, // 超过3秒
            },
            dsnEndpoint: '/api/monitoring/:appId/batch',
            backendQuery: '/api/performance/resources?slow=true',
            frontendPage: '/performance/resource-timing',
        },
        {
            id: 'timing-02',
            name: '资源性能摘要',
            description: '测试定期上报资源性能摘要',
            trigger: () => {
                // 加载多个资源
                console.log('[ResourceTiming] Loading multiple resources...')

                // 加载图片1
                const img1 = document.createElement('img')
                img1.src = 'https://httpbin.org/image/jpeg?size=100'
                document.body.appendChild(img1)

                // 加载图片2
                setTimeout(() => {
                    const img2 = document.createElement('img')
                    img2.src = 'https://httpbin.org/image/png?size=200'
                    document.body.appendChild(img2)
                }, 500)

                // 加载脚本
                setTimeout(() => {
                    const script = document.createElement('script')
                    script.src = 'https://httpbin.org/get?script=true'
                    document.head.appendChild(script)
                }, 1000)

                // 清理
                setTimeout(() => {
                    document.querySelectorAll('img[src*="httpbin.org"]').forEach(el => el.remove())
                    console.log('[ResourceTiming] Resources loaded and cleaned up')
                }, 3000)
            },
            expectedFields: ['type', 'category', 'extra.summary', 'extra.summary.totalResources', 'extra.summary.avgDuration'],
            expectedValues: {
                type: 'performance',
                category: 'resource-summary',
            },
            dsnEndpoint: '/api/monitoring/:appId/batch',
            backendQuery: '/api/performance/resources',
            frontendPage: '/performance/resource-timing',
        },
        {
            id: 'timing-03',
            name: '实时监听 (SPA)',
            description: '测试 PerformanceObserver 实时监听新资源',
            trigger: () => {
                console.log('[ResourceTiming] Testing real-time observer...')

                // 动态加载资源（模拟 SPA 场景）
                const link = document.createElement('link')
                link.rel = 'stylesheet'
                link.href = 'https://httpbin.org/get?css=true'
                link.onload = () => {
                    console.log('[ResourceTiming] Dynamic CSS loaded')
                    document.head.removeChild(link)
                }
                link.onerror = () => {
                    console.log('[ResourceTiming] Dynamic CSS error')
                    if (link.parentNode) {
                        document.head.removeChild(link)
                    }
                }
                document.head.appendChild(link)
            },
            expectedFields: ['type', 'category', 'name', 'metrics'],
            expectedValues: {
                type: 'performance',
                category: 'resource',
            },
            dsnEndpoint: '/api/monitoring/:appId/batch',
            backendQuery: '/api/performance/resources',
            frontendPage: '/performance/resource-timing',
        },
    ],
}

/**
 * 运行所有 ResourceTiming 场景
 */
export function runResourceTimingScenarios(onComplete) {
    console.log('[ResourceTiming Integration] Starting scenarios...')

    const scenarios = ResourceTimingIntegrationScenarios.scenarios
    let currentIndex = 0

    function runNext() {
        if (currentIndex >= scenarios.length) {
            console.log('[ResourceTiming Integration] All scenarios completed')
            if (onComplete) onComplete()
            return
        }

        const scenario = scenarios[currentIndex]
        console.log(`[ResourceTiming Integration] Running: ${scenario.name}`)

        try {
            scenario.trigger()
        } catch (error) {
            console.log(`[ResourceTiming Integration] ${scenario.name} error:`, error)
        }

        currentIndex++
        // 给足够的时间加载资源
        setTimeout(runNext, 6000)
    }

    runNext()
}
