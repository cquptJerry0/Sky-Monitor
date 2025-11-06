/**
 * 05-resource-error.js - ResourceErrorIntegration 测试
 *
 * 测试 ResourceErrorIntegration 的资源加载错误捕获功能
 *
 * 测试场景 (6个)：
 * 1. img 加载失败
 * 2. script 加载失败
 * 3. link 加载失败
 * 4. video 加载失败
 * 5. audio 加载失败
 * 6. 错误去重验证
 *
 * 验证字段：
 * - resource_url
 * - resource_type
 * - error_message
 * - error_fingerprint
 */

export const ResourceErrorTests = {
    name: 'ResourceError Integration',
    description: '资源加载错误捕获',
    scenarios: [
        {
            id: 'img-error',
            name: 'Image加载失败',
            description: '加载不存在的图片',
            run: () => {
                return new Promise(resolve => {
                    const img = new Image()
                    img.onerror = () => resolve('Image load error triggered')
                    img.src = 'https://nonexistent-domain-' + Date.now() + '.com/image.png'
                    setTimeout(() => resolve('Image error timeout'), 2000)
                })
            },
        },
        {
            id: 'script-error',
            name: 'Script加载失败',
            description: '加载不存在的脚本',
            run: () => {
                return new Promise(resolve => {
                    const script = document.createElement('script')
                    script.onerror = () => {
                        document.body.removeChild(script)
                        resolve('Script load error triggered')
                    }
                    script.src = 'https://nonexistent-domain-' + Date.now() + '.com/script.js'
                    document.body.appendChild(script)
                    setTimeout(() => resolve('Script error timeout'), 2000)
                })
            },
        },
        {
            id: 'link-error',
            name: 'Link加载失败',
            description: '加载不存在的样式表',
            run: () => {
                return new Promise(resolve => {
                    const link = document.createElement('link')
                    link.rel = 'stylesheet'
                    link.onerror = () => {
                        document.head.removeChild(link)
                        resolve('Link load error triggered')
                    }
                    link.href = 'https://nonexistent-domain-' + Date.now() + '.com/style.css'
                    document.head.appendChild(link)
                    setTimeout(() => resolve('Link error timeout'), 2000)
                })
            },
        },
        {
            id: 'video-error',
            name: 'Video加载失败',
            description: '加载不存在的视频',
            run: () => {
                return new Promise(resolve => {
                    const video = document.createElement('video')
                    video.onerror = () => resolve('Video load error triggered')
                    video.src = 'https://nonexistent-domain-' + Date.now() + '.com/video.mp4'
                    document.body.appendChild(video)
                    setTimeout(() => {
                        document.body.removeChild(video)
                        resolve('Video error timeout')
                    }, 2000)
                })
            },
        },
        {
            id: 'audio-error',
            name: 'Audio加载失败',
            description: '加载不存在的音频',
            run: () => {
                return new Promise(resolve => {
                    const audio = document.createElement('audio')
                    audio.onerror = () => resolve('Audio load error triggered')
                    audio.src = 'https://nonexistent-domain-' + Date.now() + '.com/audio.mp3'
                    document.body.appendChild(audio)
                    setTimeout(() => {
                        document.body.removeChild(audio)
                        resolve('Audio error timeout')
                    }, 2000)
                })
            },
        },
        {
            id: 'resource-deduplication',
            name: '资源错误去重',
            description: '5秒内相同资源错误去重',
            run: async () => {
                const url = 'https://nonexistent-domain-' + Date.now() + '.com/dedup-test.png'

                // 连续加载3次相同的失败资源
                for (let i = 0; i < 3; i++) {
                    const img = new Image()
                    img.src = url
                    await new Promise(resolve => setTimeout(resolve, 100))
                }

                return 'Resource error deduplication test - 3 identical image errors'
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

export default ResourceErrorTests
