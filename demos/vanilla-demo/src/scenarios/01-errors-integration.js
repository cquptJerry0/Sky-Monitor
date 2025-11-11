/**
 * Errors Integration 测试场景
 *
 * 功能：全局错误捕获（同步/异步/Promise/资源错误）
 * 配置：captureResourceErrors, collectDeviceInfo, collectNetworkInfo, enableDeduplication
 */

export const ErrorsIntegrationScenarios = {
    name: 'Errors Integration',
    integration: 'Errors',
    config: {
        captureResourceErrors: true,
        collectDeviceInfo: true,
        collectNetworkInfo: true,
        enableDeduplication: true,
    },
    scenarios: [
        {
            id: 'errors-01',
            name: '同步错误',
            description: '测试同步 JavaScript 错误捕获',
            trigger: () => {
                throw new Error('Test sync error from demo')
            },
            expectedFields: [
                'type',
                'message',
                'stack',
                'errorFingerprint',
                'errorFingerprint.hash',
                'errorFingerprint.algorithm',
                'device',
                'device.browser',
                'device.os',
                'network',
                'timestamp',
            ],
            expectedValues: {
                type: 'error',
                message: /Test sync error/,
                'errorFingerprint.algorithm': 'sha256',
            },
            dsnEndpoint: '/api/monitoring/:appId/critical',
            backendQuery: '/api/errors?type=runtime',
            frontendPage: '/errors',
        },
        {
            id: 'errors-02',
            name: 'Promise Rejection',
            description: '测试未处理的 Promise 拒绝捕获',
            trigger: () => {
                Promise.reject(new Error('Test promise rejection from demo'))
            },
            expectedFields: ['type', 'message', 'stack', 'errorFingerprint', 'device', 'network', 'timestamp'],
            expectedValues: {
                type: 'error',
                message: /Test promise rejection/,
            },
            dsnEndpoint: '/api/monitoring/:appId/critical',
            backendQuery: '/api/errors?type=runtime',
            frontendPage: '/errors',
        },
        {
            id: 'errors-03',
            name: '资源加载错误',
            description: '测试资源加载失败捕获',
            trigger: () => {
                const img = document.createElement('img')
                img.src = 'https://invalid-demo-url-12345.com/image.png'
                img.onerror = () => {
                    console.log('[Demo] Image load failed as expected')
                }
                document.body.appendChild(img)
                setTimeout(() => {
                    document.body.removeChild(img)
                }, 2000)
            },
            expectedFields: [
                'type',
                'message',
                'resourceError',
                'resourceError.url',
                'resourceError.tagName',
                'resourceError.resourceType',
                'timestamp',
            ],
            expectedValues: {
                type: 'error',
                'resourceError.resourceType': 'img',
                'resourceError.url': /invalid-demo-url/,
                message: /Failed to load img/,
            },
            dsnEndpoint: '/api/monitoring/:appId/critical',
            backendQuery: '/api/errors?type=resource',
            frontendPage: '/integrations/resource-errors',
        },
        {
            id: 'errors-04',
            name: '脚本加载错误',
            description: '测试脚本加载失败捕获',
            trigger: () => {
                const script = document.createElement('script')
                script.src = 'https://invalid-demo-url-12345.com/script.js'
                script.onerror = () => {
                    console.log('[Demo] Script load failed as expected')
                }
                document.head.appendChild(script)
                setTimeout(() => {
                    document.head.removeChild(script)
                }, 2000)
            },
            expectedFields: [
                'type',
                'message',
                'resourceError',
                'resourceError.url',
                'resourceError.tagName',
                'resourceError.resourceType',
                'timestamp',
            ],
            expectedValues: {
                type: 'error',
                'resourceError.resourceType': 'script',
                'resourceError.url': /invalid-demo-url/,
                message: /Failed to load script/,
            },
            dsnEndpoint: '/api/monitoring/:appId/critical',
            backendQuery: '/api/errors?type=resource',
            frontendPage: '/integrations/resource-errors',
        },
    ],
}

/**
 * 运行所有错误场景
 */
export function runErrorsScenarios(onComplete) {
    console.log('[Errors Integration] Starting scenarios...')
    const scenarios = ErrorsIntegrationScenarios.scenarios

    let currentIndex = 0

    function runNext() {
        if (currentIndex >= scenarios.length) {
            console.log('[Errors Integration] All scenarios completed')
            if (onComplete) onComplete()
            return
        }

        const scenario = scenarios[currentIndex]
        console.log(`[Errors Integration] Running: ${scenario.name}`)

        try {
            scenario.trigger()
        } catch (error) {
            // 同步错误会被捕获，这是预期的
            console.log(`[Errors Integration] ${scenario.name} triggered (error caught)`)
        }

        currentIndex++
        // 延迟1秒执行下一个场景，给SDK足够时间处理
        setTimeout(runNext, 1000)
    }

    runNext()
}
