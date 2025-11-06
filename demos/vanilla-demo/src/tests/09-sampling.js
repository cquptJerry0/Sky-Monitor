/**
 * 09-sampling.js - SamplingIntegration 测试
 *
 * 测试 SamplingIntegration 的分层采样功能
 *
 * 测试场景 (3个)：
 * 1. 错误采样率 100%
 * 2. 性能采样率 100%
 * 3. 采样元数据验证
 *
 * 验证字段：
 * - sampling_rate
 * - sampling_sampled
 * - _sampling 元数据
 */

export const SamplingTests = {
    name: 'Sampling Integration',
    description: '分层采样',
    scenarios: [
        {
            id: 'error-sampling',
            name: '错误采样',
            description: '验证错误100%采样（Demo模式）',
            run: async () => {
                // 触发多个错误
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        throw new Error(`Sampling Test - Error ${i} (should all be sampled)`)
                    }, i * 100)
                }

                await new Promise(resolve => setTimeout(resolve, 600))

                return 'Error sampling test - all 5 errors should be sampled (100%)'
            },
        },
        {
            id: 'performance-sampling',
            name: '性能采样',
            description: '验证性能100%采样（Demo模式）',
            run: async () => {
                // 触发多个性能事件
                for (let i = 0; i < 5; i++) {
                    fetch('https://httpstat.us/200').catch(() => {})
                    await new Promise(resolve => setTimeout(resolve, 200))
                }

                return 'Performance sampling test - all requests should be sampled (100%)'
            },
        },
        {
            id: 'sampling-metadata',
            name: '采样元数据',
            description: '验证_sampling字段包含正确信息',
            run: () => {
                // 触发一个错误，验证采样元数据
                throw new Error('Sampling Test - Error to verify _sampling metadata')

                // 元数据应包含：
                // _sampling.rate: 1.0 (100%)
                // _sampling.sampled: true
                // _sampling.timestamp
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

export default SamplingTests
