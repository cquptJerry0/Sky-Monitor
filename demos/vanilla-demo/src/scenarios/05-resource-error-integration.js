/**
 * ResourceError Integration 测试场景
 *
 * 功能：资源加载错误捕获（img/script/link/video/audio）
 * 配置：captureConsole, enableDeduplication
 */

export const ResourceErrorIntegrationScenarios = {
    name: 'ResourceError Integration',
    integration: 'ResourceErrorIntegration',
    config: {
        captureConsole: true,
        enableDeduplication: true,
    },
    scenarios: [
        {
            id: 'resource-01',
            name: '图片加载失败',
            description: '测试图片资源加载失败捕获',
            trigger: () => {
                const img = document.createElement('img')
                img.src = 'https://invalid-resource-domain-12345.com/test-image.png'
                img.alt = 'Test Image for ResourceError'
                img.onerror = () => console.log('[ResourceError] Image load failed')
                document.body.appendChild(img)
                setTimeout(() => document.body.removeChild(img), 2000)
            },
            expectedFields: [
                'type',
                'message',
                'resourceError',
                'resourceError.url',
                'resourceError.tagName',
                'resourceError.resourceType',
                'resourceError.outerHTML',
                'timestamp',
            ],
            expectedValues: {
                type: 'error',
                message: /Failed to load img/,
                'resourceError.tagName': 'IMG',
                'resourceError.resourceType': 'img',
            },
            dsnEndpoint: '/api/monitoring/:appId/critical',
            backendQuery: '/api/errors?type=resource',
            frontendPage: '/integrations/resource-errors',
        },
        {
            id: 'resource-02',
            name: '脚本加载失败',
            description: '测试脚本资源加载失败捕获',
            trigger: () => {
                const script = document.createElement('script')
                script.src = 'https://invalid-resource-domain-12345.com/test-script.js'
                script.onerror = () => console.log('[ResourceError] Script load failed')
                document.head.appendChild(script)
                setTimeout(() => document.head.removeChild(script), 2000)
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
                message: /Failed to load script/,
                'resourceError.tagName': 'SCRIPT',
                'resourceError.resourceType': 'script',
            },
            dsnEndpoint: '/api/monitoring/:appId/critical',
            backendQuery: '/api/errors?type=resource',
            frontendPage: '/integrations/resource-errors',
        },
        {
            id: 'resource-03',
            name: '样式加载失败',
            description: '测试样式资源加载失败捕获',
            trigger: () => {
                const link = document.createElement('link')
                link.rel = 'stylesheet'
                link.href = 'https://invalid-resource-domain-12345.com/test-style.css'
                link.onerror = () => console.log('[ResourceError] CSS load failed')
                document.head.appendChild(link)
                setTimeout(() => document.head.removeChild(link), 2000)
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
                message: /Failed to load link/,
                'resourceError.tagName': 'LINK',
                'resourceError.resourceType': 'link',
            },
            dsnEndpoint: '/api/monitoring/:appId/critical',
            backendQuery: '/api/errors?type=resource',
            frontendPage: '/integrations/resource-errors',
        },
    ],
}

/**
 * 运行所有 ResourceError 场景
 */
export function runResourceErrorScenarios(onComplete) {
    console.log('[ResourceError Integration] Starting scenarios...')
    const scenarios = ResourceErrorIntegrationScenarios.scenarios

    let currentIndex = 0

    function runNext() {
        if (currentIndex >= scenarios.length) {
            console.log('[ResourceError Integration] All scenarios completed')
            if (onComplete) onComplete()
            return
        }

        const scenario = scenarios[currentIndex]
        console.log(`[ResourceError Integration] Running: ${scenario.name}`)

        try {
            scenario.trigger()
        } catch (error) {
            console.log(`[ResourceError Integration] ${scenario.name} error:`, error)
        }

        currentIndex++
        setTimeout(runNext, 2500)
    }

    runNext()
}
