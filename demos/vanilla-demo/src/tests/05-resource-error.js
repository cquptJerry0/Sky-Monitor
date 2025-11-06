/**
 * Integration 5: ResourceErrorIntegration - 资源加载错误测试
 *
 * 测试场景：
 * 1. 图片加载失败
 * 2. 脚本加载失败
 * 3. CSS 样式表加载失败
 * 4. 视频加载失败
 * 5. 音频加载失败
 * 6. 错误去重验证
 *
 * 验证点：
 * - resource_url 正确
 * - resource_type 正确（img/script/link/video/audio）
 * - error_message 格式正确
 * - error_fingerprint 生成
 */

import { addBreadcrumb } from '@sky-monitor/monitor-sdk-browser'

export const ResourceErrorTests = {
    name: 'ResourceError Integration',
    totalTests: 6,
    tests: [
        {
            id: 'resource-error-01',
            name: '图片加载失败',
            description: '测试图片资源加载错误捕获',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：图片加载失败',
                    category: 'test',
                    level: 'info',
                })

                return new Promise(resolve => {
                    const img = new Image()
                    img.onerror = () => {
                        setTimeout(resolve, 500)
                    }
                    img.src = 'https://nonexistent-domain-test-12345.com/test-image.png'

                    // 超时保护
                    setTimeout(resolve, 3000)
                })
            },
            expectedFields: ['resource_url', 'resource_type', 'error_message'],
            timeout: 5000,
        },
        {
            id: 'resource-error-02',
            name: '脚本加载失败',
            description: '测试 JavaScript 文件加载错误',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：脚本加载失败',
                    category: 'test',
                    level: 'info',
                })

                return new Promise(resolve => {
                    const script = document.createElement('script')
                    script.onerror = () => {
                        document.body.removeChild(script)
                        setTimeout(resolve, 500)
                    }
                    script.src = 'https://nonexistent-domain-test-12345.com/test-script.js'
                    document.body.appendChild(script)

                    // 超时保护
                    setTimeout(() => {
                        if (script.parentNode) {
                            document.body.removeChild(script)
                        }
                        resolve()
                    }, 3000)
                })
            },
            expectedFields: ['resource_url', 'resource_type', 'error_message'],
            timeout: 5000,
        },
        {
            id: 'resource-error-03',
            name: 'CSS 样式表加载失败',
            description: '测试 CSS 文件加载错误',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：CSS 加载失败',
                    category: 'test',
                    level: 'info',
                })

                return new Promise(resolve => {
                    const link = document.createElement('link')
                    link.rel = 'stylesheet'
                    link.onerror = () => {
                        document.head.removeChild(link)
                        setTimeout(resolve, 500)
                    }
                    link.href = 'https://nonexistent-domain-test-12345.com/test-styles.css'
                    document.head.appendChild(link)

                    // 超时保护
                    setTimeout(() => {
                        if (link.parentNode) {
                            document.head.removeChild(link)
                        }
                        resolve()
                    }, 3000)
                })
            },
            expectedFields: ['resource_url', 'resource_type', 'error_message'],
            timeout: 5000,
        },
        {
            id: 'resource-error-04',
            name: '视频加载失败',
            description: '测试视频资源加载错误',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：视频加载失败',
                    category: 'test',
                    level: 'info',
                })

                return new Promise(resolve => {
                    const video = document.createElement('video')
                    video.onerror = () => {
                        setTimeout(resolve, 500)
                    }
                    video.src = 'https://nonexistent-domain-test-12345.com/test-video.mp4'

                    // 不添加到 DOM，避免影响页面
                    // 超时保护
                    setTimeout(resolve, 3000)
                })
            },
            expectedFields: ['resource_url', 'resource_type', 'error_message'],
            timeout: 5000,
        },
        {
            id: 'resource-error-05',
            name: '音频加载失败',
            description: '测试音频资源加载错误',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：音频加载失败',
                    category: 'test',
                    level: 'info',
                })

                return new Promise(resolve => {
                    const audio = new Audio()
                    audio.onerror = () => {
                        setTimeout(resolve, 500)
                    }
                    audio.src = 'https://nonexistent-domain-test-12345.com/test-audio.mp3'

                    // 超时保护
                    setTimeout(resolve, 3000)
                })
            },
            expectedFields: ['resource_url', 'resource_type', 'error_message'],
            timeout: 5000,
        },
        {
            id: 'resource-error-06',
            name: '资源错误去重',
            description: '测试相同资源错误的去重',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：资源错误去重',
                    category: 'test',
                    level: 'info',
                })

                const sameUrl = 'https://nonexistent-domain-test-12345.com/duplicate-image.png'

                // 连续加载 3 次相同的失败资源
                const promises = []
                for (let i = 0; i < 3; i++) {
                    promises.push(
                        new Promise(resolve => {
                            const img = new Image()
                            img.onerror = () => resolve()
                            img.src = sameUrl
                            setTimeout(resolve, 2000)
                        })
                    )
                    await new Promise(resolve => setTimeout(resolve, 200))
                }

                await Promise.all(promises)

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>资源错误去重测试</h3>
                        <p>已连续加载 3 次相同的失败资源</p>
                        <p>URL: ${sameUrl}</p>
                        <p>预期: 只上报 1 次，dedup_count = 3</p>
                        <p>查看后端数据验证去重是否生效</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['resource_url', 'resource_type', 'error_fingerprint'],
            expectedDedup: true,
            timeout: 8000,
        },
    ],
}

// 导出单独的测试函数
export function testImageError() {
    return ResourceErrorTests.tests[0].run()
}

export function testScriptError() {
    return ResourceErrorTests.tests[1].run()
}

export function testCSSError() {
    return ResourceErrorTests.tests[2].run()
}

export function testVideoError() {
    return ResourceErrorTests.tests[3].run()
}

export function testAudioError() {
    return ResourceErrorTests.tests[4].run()
}

export function testResourceErrorDedup() {
    return ResourceErrorTests.tests[5].run()
}

// 运行所有资源错误测试
export async function runAllResourceErrorTests() {
    const results = []

    for (const test of ResourceErrorTests.tests) {
        try {
            await test.run()
            results.push({ id: test.id, name: test.name, status: 'passed' })
        } catch (error) {
            results.push({ id: test.id, name: test.name, status: 'failed', error: error.message })
        }
    }

    return results
}
