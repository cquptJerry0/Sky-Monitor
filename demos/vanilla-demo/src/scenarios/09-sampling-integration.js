/**
 * Sampling Integration 测试场景
 *
 * 功能：分层采样（错误100%，性能30%）
 * 配置：errorSampleRate, performanceSampleRate
 */

export const SamplingIntegrationScenarios = {
    name: 'Sampling Integration',
    integration: 'SamplingIntegration',
    config: {
        errorSampleRate: 1.0, // 100% 错误采样
        performanceSampleRate: 0.3, // 30% 性能采样
    },
    scenarios: [
        {
            id: 'sampling-01',
            name: '错误事件采样',
            description: '测试错误事件按 errorSampleRate 采样（100%）',
            trigger: () => {
                // 触发10个错误
                for (let i = 1; i <= 10; i++) {
                    setTimeout(() => {
                        try {
                            throw new Error(`Test error ${i} for sampling`)
                        } catch (error) {
                            console.log(`[Sampling] Error ${i} triggered`)
                        }
                    }, i * 300)
                }
            },
            expectedFields: ['_sampling', '_sampling.rate', '_sampling.sampled', '_sampling.timestamp'],
            expectedValues: {
                '_sampling.rate': 1.0,
                '_sampling.sampled': true,
            },
            dsnEndpoint: '附加在所有事件中',
            backendQuery: '验证所有10个错误都被上报',
            frontendPage: '/errors',
        },
        {
            id: 'sampling-02',
            name: '性能事件采样',
            description: '测试性能事件按 performanceSampleRate 采样（30%）',
            trigger: async () => {
                // 触发10个性能事件（慢请求）
                console.log('[Sampling] Triggering 10 performance events...')
                for (let i = 1; i <= 10; i++) {
                    setTimeout(async () => {
                        try {
                            await fetch(`https://httpbin.org/delay/1?request=${i}`)
                            console.log(`[Sampling] Performance event ${i} completed`)
                        } catch (error) {
                            console.log(`[Sampling] Performance event ${i} error:`, error)
                        }
                    }, i * 1500)
                }
            },
            expectedFields: ['_sampling', '_sampling.rate', '_sampling.sampled'],
            expectedValues: {
                '_sampling.rate': 0.3,
                // sampled 应该有部分为 true，部分为 false
            },
            dsnEndpoint: '附加在所有性能事件中',
            backendQuery: '验证约30%的性能事件被上报',
            frontendPage: '/performance',
        },
    ],
}

/**
 * 运行所有 Sampling 场景
 */
export function runSamplingScenarios(onComplete) {
    console.log('[Sampling Integration] Starting scenarios...')
    console.log('[Sampling Integration] Note: Performance events are sampled at 30%, so not all will be reported')

    const scenarios = SamplingIntegrationScenarios.scenarios
    let currentIndex = 0

    async function runNext() {
        if (currentIndex >= scenarios.length) {
            console.log('[Sampling Integration] All scenarios completed')
            if (onComplete) onComplete()
            return
        }

        const scenario = scenarios[currentIndex]
        console.log(`[Sampling Integration] Running: ${scenario.name}`)

        try {
            await scenario.trigger()
        } catch (error) {
            console.log(`[Sampling Integration] ${scenario.name} error:`, error)
        }

        currentIndex++
        // 给足够的时间完成所有请求
        setTimeout(runNext, 20000) // 20秒
    }

    runNext()
}
