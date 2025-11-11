/**
 * Metrics Integration 测试场景
 *
 * 功能：Core Web Vitals (LCP, FCP, CLS, TTFB, INP)
 * 配置：无配置项
 */

export const MetricsIntegrationScenarios = {
    name: 'Metrics Integration',
    integration: 'Metrics',
    config: {
        // Metrics 没有配置项
    },
    scenarios: [
        {
            id: 'metrics-01',
            name: 'LCP (Largest Contentful Paint)',
            description: '测试 LCP 指标自动上报',
            trigger: 'automatic', // 自动触发
            expectedFields: ['type', 'name', 'value', 'metrics', 'path', 'timestamp'],
            expectedValues: {
                type: 'webVital',
                name: 'LCP',
            },
            dsnEndpoint: '/api/monitoring/:appId/batch',
            backendQuery: '/api/performance/web-vitals?metric=LCP',
            frontendPage: '/performance/web-vitals',
        },
        {
            id: 'metrics-02',
            name: 'FCP (First Contentful Paint)',
            description: '测试 FCP 指标自动上报',
            trigger: 'automatic',
            expectedFields: ['type', 'name', 'value', 'metrics', 'path', 'timestamp'],
            expectedValues: {
                type: 'webVital',
                name: 'FCP',
            },
            dsnEndpoint: '/api/monitoring/:appId/batch',
            backendQuery: '/api/performance/web-vitals?metric=FCP',
            frontendPage: '/performance/web-vitals',
        },
        {
            id: 'metrics-03',
            name: 'CLS (Cumulative Layout Shift)',
            description: '测试 CLS 指标自动上报',
            trigger: 'automatic',
            expectedFields: ['type', 'name', 'value', 'metrics', 'path', 'timestamp'],
            expectedValues: {
                type: 'webVital',
                name: 'CLS',
            },
            dsnEndpoint: '/api/monitoring/:appId/batch',
            backendQuery: '/api/performance/web-vitals?metric=CLS',
            frontendPage: '/performance/web-vitals',
        },
        {
            id: 'metrics-04',
            name: 'TTFB (Time to First Byte)',
            description: '测试 TTFB 指标自动上报',
            trigger: 'automatic',
            expectedFields: ['type', 'name', 'value', 'metrics', 'path', 'timestamp'],
            expectedValues: {
                type: 'webVital',
                name: 'TTFB',
            },
            dsnEndpoint: '/api/monitoring/:appId/batch',
            backendQuery: '/api/performance/web-vitals?metric=TTFB',
            frontendPage: '/performance/web-vitals',
        },
        {
            id: 'metrics-05',
            name: 'INP (Interaction to Next Paint)',
            description: '测试 INP 指标上报',
            trigger: () => {
                // INP 需要用户交互触发
                const button = document.createElement('button')
                button.textContent = 'Click me for INP'
                button.style.cssText = 'padding: 10px; margin: 10px;'
                button.onclick = () => {
                    // 模拟一些计算
                    let sum = 0
                    for (let i = 0; i < 100000; i++) {
                        sum += i
                    }
                    console.log('[Metrics] INP triggered, result:', sum)
                    document.body.removeChild(button)
                }
                document.body.appendChild(button)
                // 自动点击
                setTimeout(() => button.click(), 100)
            },
            expectedFields: ['type', 'name', 'value', 'metrics', 'path', 'timestamp'],
            expectedValues: {
                type: 'webVital',
                name: 'INP',
            },
            dsnEndpoint: '/api/monitoring/:appId/batch',
            backendQuery: '/api/performance/web-vitals?metric=INP',
            frontendPage: '/performance/web-vitals',
        },
    ],
}

/**
 * 运行所有 Metrics 场景
 */
export function runMetricsScenarios(onComplete) {
    console.log('[Metrics Integration] Starting scenarios...')
    console.log('[Metrics Integration] LCP, FCP, CLS, TTFB are automatically collected on page load')

    // 只运行 INP 场景（其他指标自动收集）
    const inpScenario = MetricsIntegrationScenarios.scenarios.find(s => s.id === 'metrics-05')

    if (inpScenario && typeof inpScenario.trigger === 'function') {
        console.log(`[Metrics Integration] Running: ${inpScenario.name}`)
        inpScenario.trigger()
    }

    // 等待2秒后完成
    setTimeout(() => {
        console.log('[Metrics Integration] All scenarios completed')
        if (onComplete) onComplete()
    }, 2000)
}
