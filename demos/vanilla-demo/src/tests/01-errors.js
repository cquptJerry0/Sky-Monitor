/**
 * 01-errors.js - Errors Integration 测试
 *
 * 测试 Errors Integration 的全局错误捕获功能
 *
 * 测试场景 (8个)：
 * 1. 同步错误 (throw new Error)
 * 2. 异步错误 (setTimeout)
 * 3. Promise拒绝 (unhandledrejection)
 * 4. 引用错误 (undefined variable)
 * 5. 类型错误 (null.method())
 * 6. 自定义错误类
 * 7. 资源加载错误
 * 8. 错误去重验证
 *
 * 验证字段：
 * - error_message
 * - error_stack
 * - error_fingerprint
 * - device_* (browser, os, deviceType等)
 * - network_* (effectiveType, rtt)
 * - dedup_count
 */

export const ErrorsTests = {
    name: 'Errors Integration',
    description: '全局错误捕获',
    scenarios: [
        {
            id: 'sync-error',
            name: '同步错误',
            description: '抛出同步Error，验证立即捕获',
            run: () => {
                throw new Error('Sync Error Test - This is a test error')
            },
        },
        {
            id: 'async-error',
            name: '异步错误',
            description: 'setTimeout中的错误捕获',
            run: () => {
                setTimeout(() => {
                    throw new Error('Async Error Test - Error in setTimeout')
                }, 100)
            },
        },
        {
            id: 'promise-rejection',
            name: 'Promise拒绝',
            description: '未处理的Promise拒绝',
            run: () => {
                Promise.reject(new Error('Promise Rejection Test - Unhandled rejection'))
            },
        },
        {
            id: 'reference-error',
            name: '引用错误',
            description: '访问未定义变量',
            run: () => {
                undefinedVariable.someMethod()
            },
        },
        {
            id: 'type-error',
            name: '类型错误',
            description: '在null/undefined上调用方法',
            run: () => {
                const obj = null
                obj.method()
            },
        },
        {
            id: 'custom-error',
            name: '自定义错误类',
            description: '扩展Error类的自定义错误',
            run: () => {
                class CustomError extends Error {
                    constructor(message) {
                        super(message)
                        this.name = 'CustomError'
                        this.code = 'CUSTOM_001'
                    }
                }
                throw new CustomError('Custom Error Test - Custom error with code')
            },
        },
        {
            id: 'resource-error',
            name: '资源加载错误',
            description: '加载不存在的图片',
            run: () => {
                const img = new Image()
                img.src = 'https://nonexistent-domain-' + Date.now() + '.com/test.png'
                document.body.appendChild(img)
                // 等待错误触发
                return new Promise(resolve => setTimeout(resolve, 1000))
            },
        },
        {
            id: 'deduplication',
            name: '错误去重验证',
            description: '5秒内相同错误只上报一次',
            run: async () => {
                // 连续抛出3个相同的错误
                for (let i = 0; i < 3; i++) {
                    try {
                        throw new Error('Deduplication Test - Same error message')
                    } catch (e) {
                        // 捕获但不处理，让全局错误处理器捕获
                        setTimeout(() => {
                            throw e
                        }, i * 100)
                    }
                }
                // 等待所有错误触发
                await new Promise(resolve => setTimeout(resolve, 500))

                // 5秒后再次抛出，应该会重新上报
                await new Promise(resolve => setTimeout(resolve, 5000))
                throw new Error('Deduplication Test - Same error message')
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
                await scenario.run()
                results.push({
                    id: scenario.id,
                    name: scenario.name,
                    status: 'success',
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
            await scenario.run()
            return {
                id: scenario.id,
                name: scenario.name,
                status: 'success',
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

// 导出供UI使用
export default ErrorsTests
