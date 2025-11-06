/**
 * 10-deduplication.js - DeduplicationIntegration 测试
 *
 * 测试 DeduplicationIntegration 的错误去重功能
 *
 * 测试场景 (3个)：
 * 1. 5秒内相同错误去重
 * 2. 去重计数累加
 * 3. 5秒后重新上报
 *
 * 验证字段：
 * - dedup_count
 * - error_fingerprint
 * - _deduplication 元数据
 */

export const DeduplicationTests = {
    name: 'Deduplication Integration',
    description: '错误去重',
    scenarios: [
        {
            id: 'dedup-within-window',
            name: '窗口内去重',
            description: '5秒内相同错误只上报一次',
            run: async () => {
                const errorMessage = 'Deduplication Test - Same error message'

                // 连续抛出5个相同的错误
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        throw new Error(errorMessage)
                    }, i * 200)
                }

                await new Promise(resolve => setTimeout(resolve, 1200))

                return 'Deduplication test - 5 identical errors within 5s window (should report only once)'
            },
        },
        {
            id: 'dedup-count',
            name: '去重计数',
            description: '验证dedup_count累加',
            run: async () => {
                const errorMessage = 'Deduplication Test - Count accumulation'

                // 抛出10个相同错误，验证计数
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        throw new Error(errorMessage)
                    }, i * 100)
                }

                await new Promise(resolve => setTimeout(resolve, 1200))

                return 'Deduplication count test - dedup_count should be 10'
            },
        },
        {
            id: 'dedup-after-window',
            name: '窗口过期后重新上报',
            description: '5秒后相同错误重新上报',
            run: async () => {
                const errorMessage = 'Deduplication Test - Window expiration'

                // 第一次抛出
                setTimeout(() => {
                    throw new Error(errorMessage)
                }, 100)

                await new Promise(resolve => setTimeout(resolve, 500))

                // 5秒后再次抛出，应该重新上报
                await new Promise(resolve => setTimeout(resolve, 5000))

                throw new Error(errorMessage)

                // 应该有2条上报：第一次和5秒后
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
                // 等待窗口过期
                if (scenario.id === 'dedup-after-window') {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }
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

export default DeduplicationTests
