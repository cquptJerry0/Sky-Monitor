/**
 * HttpError Integration 测试场景
 *
 * 功能：HTTP 错误捕获（Fetch/XHR）
 * 配置：captureSuccessfulRequests, captureHeaders, captureBody, failedStatusCodes, sensitiveHeaders, enableDeduplication
 */

export const HttpErrorIntegrationScenarios = {
    name: 'HttpError Integration',
    integration: 'HttpErrorIntegration',
    config: {
        captureSuccessfulRequests: false,
        captureHeaders: true,
        captureBody: false,
        failedStatusCodes: [400, 401, 403, 404, 500, 502, 503, 504],
        sensitiveHeaders: ['authorization', 'cookie', 'x-api-key'],
        enableDeduplication: true,
    },
    scenarios: [
        {
            id: 'http-01',
            name: '4xx 客户端错误 (404)',
            description: '测试 Fetch 404 错误捕获',
            trigger: async () => {
                try {
                    await fetch('https://httpbin.org/status/404')
                } catch (error) {
                    console.log('[HttpError] 404 error triggered')
                }
            },
            expectedFields: [
                'type',
                'message',
                'httpError',
                'httpError.url',
                'httpError.method',
                'httpError.status',
                'httpError.statusText',
                'httpError.duration',
                'timestamp',
            ],
            expectedValues: {
                type: 'error',
                'httpError.status': 404,
                'httpError.method': 'GET',
                message: /HTTP 404/,
            },
            dsnEndpoint: '/api/monitoring/:appId/critical',
            backendQuery: '/api/errors?type=http',
            frontendPage: '/integrations/http-errors',
        },
        {
            id: 'http-02',
            name: '5xx 服务器错误 (500)',
            description: '测试 Fetch 500 错误捕获',
            trigger: async () => {
                try {
                    await fetch('https://httpbin.org/status/500')
                } catch (error) {
                    console.log('[HttpError] 500 error triggered')
                }
            },
            expectedFields: ['type', 'message', 'httpError', 'httpError.status', 'httpError.duration', 'timestamp'],
            expectedValues: {
                type: 'error',
                'httpError.status': 500,
                message: /HTTP 500/,
            },
            dsnEndpoint: '/api/monitoring/:appId/critical',
            backendQuery: '/api/errors?type=http',
            frontendPage: '/integrations/http-errors',
        },
        {
            id: 'http-03',
            name: 'XHR 错误',
            description: '测试 XHR 404 错误捕获',
            trigger: () => {
                const xhr = new XMLHttpRequest()
                xhr.open('GET', 'https://httpbin.org/status/404')
                xhr.onloadend = () => {
                    console.log('[HttpError] XHR 404 error triggered')
                }
                xhr.send()
            },
            expectedFields: ['type', 'message', 'httpError', 'httpError.status', 'timestamp'],
            expectedValues: {
                type: 'error',
                'httpError.status': 404,
                'httpError.method': 'GET',
            },
            dsnEndpoint: '/api/monitoring/:appId/critical',
            backendQuery: '/api/errors?type=http',
            frontendPage: '/integrations/http-errors',
        },
        {
            id: 'http-04',
            name: '网络错误',
            description: '测试网络连接失败捕获',
            trigger: async () => {
                try {
                    await fetch('https://invalid-domain-12345-does-not-exist.com')
                } catch (error) {
                    console.log('[HttpError] Network error triggered')
                }
            },
            expectedFields: ['type', 'message', 'httpError', 'httpError.status', 'timestamp'],
            expectedValues: {
                type: 'error',
                'httpError.status': 0, // 网络错误状态码为 0
                message: /HTTP 0/,
            },
            dsnEndpoint: '/api/monitoring/:appId/critical',
            backendQuery: '/api/errors?type=http',
            frontendPage: '/integrations/http-errors',
        },
    ],
}

/**
 * 运行所有 HttpError 场景
 */
export function runHttpErrorScenarios(onComplete) {
    console.log('[HttpError Integration] Starting scenarios...')
    const scenarios = HttpErrorIntegrationScenarios.scenarios

    let currentIndex = 0

    async function runNext() {
        if (currentIndex >= scenarios.length) {
            console.log('[HttpError Integration] All scenarios completed')
            if (onComplete) onComplete()
            return
        }

        const scenario = scenarios[currentIndex]
        console.log(`[HttpError Integration] Running: ${scenario.name}`)

        try {
            await scenario.trigger()
        } catch (error) {
            console.log(`[HttpError Integration] ${scenario.name} error:`, error)
        }

        currentIndex++
        setTimeout(runNext, 2000) // 2秒间隔，等待网络请求完成
    }

    runNext()
}
