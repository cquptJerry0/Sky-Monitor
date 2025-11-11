/**
 * Breadcrumb Integration 测试场景
 *
 * 功能：用户行为轨迹追踪（自动捕获 console/DOM/fetch/XHR/history）
 * 配置：console, dom, fetch, history, xhr, input, maxBreadcrumbs
 */

export const BreadcrumbIntegrationScenarios = {
    name: 'Breadcrumb Integration',
    integration: 'BreadcrumbIntegration',
    config: {
        console: true,
        dom: true,
        fetch: true,
        history: true,
        xhr: true,
        input: false, // 隐私考虑
        maxBreadcrumbs: 100,
    },
    scenarios: [
        {
            id: 'breadcrumb-01',
            name: 'Console 日志',
            description: '测试 console.log/warn/error 自动记录为面包屑',
            trigger: () => {
                console.log('[Breadcrumb Test] This is a log message')
                console.warn('[Breadcrumb Test] This is a warning')
                console.error('[Breadcrumb Test] This is an error')
            },
            expectedFields: [
                'breadcrumbs',
                'breadcrumbs[].message',
                'breadcrumbs[].level',
                'breadcrumbs[].category',
                'breadcrumbs[].timestamp',
            ],
            expectedValues: {
                'breadcrumbs[].category': 'console',
            },
            dsnEndpoint: '附加在所有事件中',
            backendQuery: '附加在错误详情中',
            frontendPage: '/errors (错误详情页)',
        },
        {
            id: 'breadcrumb-02',
            name: 'DOM 点击',
            description: '测试点击事件自动记录为面包屑',
            trigger: () => {
                const button = document.createElement('button')
                button.id = 'test-breadcrumb-button'
                button.textContent = 'Click me for Breadcrumb'
                button.style.cssText = 'padding: 10px; margin: 10px;'
                document.body.appendChild(button)

                // 自动点击
                setTimeout(() => {
                    button.click()
                    console.log('[Breadcrumb] Button clicked')
                    document.body.removeChild(button)
                }, 100)
            },
            expectedFields: ['breadcrumbs', 'breadcrumbs[].message', 'breadcrumbs[].category', 'breadcrumbs[].data'],
            expectedValues: {
                'breadcrumbs[].category': 'ui',
                'breadcrumbs[].message': /Clicked:/,
            },
            dsnEndpoint: '附加在所有事件中',
            backendQuery: '附加在错误详情中',
            frontendPage: '/errors (错误详情页)',
        },
        {
            id: 'breadcrumb-03',
            name: 'Fetch 请求',
            description: '测试 Fetch 请求自动记录为面包屑',
            trigger: async () => {
                try {
                    await fetch('https://httpbin.org/get')
                    console.log('[Breadcrumb] Fetch request completed')
                } catch (error) {
                    console.log('[Breadcrumb] Fetch error:', error)
                }
            },
            expectedFields: ['breadcrumbs', 'breadcrumbs[].category', 'breadcrumbs[].data.method', 'breadcrumbs[].data.url'],
            expectedValues: {
                'breadcrumbs[].category': 'http',
                'breadcrumbs[].message': /Fetch/,
            },
            dsnEndpoint: '附加在所有事件中',
            backendQuery: '附加在错误详情中',
            frontendPage: '/errors (错误详情页)',
        },
        {
            id: 'breadcrumb-04',
            name: 'XHR 请求',
            description: '测试 XHR 请求自动记录为面包屑',
            trigger: () => {
                const xhr = new XMLHttpRequest()
                xhr.open('GET', 'https://httpbin.org/get')
                xhr.onloadend = () => {
                    console.log('[Breadcrumb] XHR request completed')
                }
                xhr.send()
            },
            expectedFields: ['breadcrumbs', 'breadcrumbs[].category', 'breadcrumbs[].data.method', 'breadcrumbs[].data.url'],
            expectedValues: {
                'breadcrumbs[].category': 'http',
                'breadcrumbs[].message': /XHR/,
            },
            dsnEndpoint: '附加在所有事件中',
            backendQuery: '附加在错误详情中',
            frontendPage: '/errors (错误详情页)',
        },
    ],
}

/**
 * 运行所有 Breadcrumb 场景
 */
export function runBreadcrumbScenarios(onComplete) {
    console.log('[Breadcrumb Integration] Starting scenarios...')
    const scenarios = BreadcrumbIntegrationScenarios.scenarios

    let currentIndex = 0

    async function runNext() {
        if (currentIndex >= scenarios.length) {
            console.log('[Breadcrumb Integration] All scenarios completed')
            if (onComplete) onComplete()
            return
        }

        const scenario = scenarios[currentIndex]
        console.log(`[Breadcrumb Integration] Running: ${scenario.name}`)

        try {
            await scenario.trigger()
        } catch (error) {
            console.log(`[Breadcrumb Integration] ${scenario.name} error:`, error)
        }

        currentIndex++
        setTimeout(runNext, 1500)
    }

    runNext()
}
