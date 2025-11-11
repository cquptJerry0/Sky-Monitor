/**
 * Deduplication Integration 测试场景
 *
 * 功能：错误去重（5秒窗口内相同 fingerprint 只上报一次）
 * 配置：maxCacheSize, timeWindow
 */

export const DeduplicationIntegrationScenarios = {
    name: 'Deduplication Integration',
    integration: 'DeduplicationIntegration',
    config: {
        maxCacheSize: 100,
        timeWindow: 5000, // 5秒
    },
    scenarios: [
        {
            id: 'dedup-01',
            name: '相同错误去重',
            description: '测试5秒内相同错误只上报一次',
            trigger: () => {
                // 在2秒内触发10次相同错误
                console.log('[Deduplication] Triggering 10 identical errors in 2 seconds...')
                for (let i = 1; i <= 10; i++) {
                    setTimeout(() => {
                        try {
                            throw new Error('Identical error for deduplication test')
                        } catch (error) {
                            console.log(`[Deduplication] Error ${i} triggered (should be deduplicated)`)
                        }
                    }, i * 200)
                }
            },
            expectedFields: ['_deduplication', '_deduplication.fingerprint', '_deduplication.count'],
            expectedValues: {
                '_deduplication.count': 10, // 去重计数应该为10
            },
            dsnEndpoint: '附加在所有事件中',
            backendQuery: '验证只上报了1次，count=10',
            frontendPage: '/errors (错误详情页显示去重次数)',
        },
        {
            id: 'dedup-02',
            name: '不同错误不去重',
            description: '测试不同错误分别上报',
            trigger: () => {
                // 触发5个不同的错误
                console.log('[Deduplication] Triggering 5 different errors...')
                for (let i = 1; i <= 5; i++) {
                    setTimeout(() => {
                        try {
                            throw new Error(`Different error ${i} for deduplication test`)
                        } catch (error) {
                            console.log(`[Deduplication] Error ${i} triggered (should NOT be deduplicated)`)
                        }
                    }, i * 300)
                }
            },
            expectedFields: ['_deduplication', '_deduplication.fingerprint', '_deduplication.count'],
            expectedValues: {
                '_deduplication.count': 1, // 每个错误的 count 应该为1
            },
            dsnEndpoint: '附加在所有事件中',
            backendQuery: '验证上报了5次，每次 count=1',
            frontendPage: '/errors',
        },
        {
            id: 'dedup-03',
            name: '超时后重新上报',
            description: '测试超过5秒窗口后相同错误重新上报',
            trigger: () => {
                // 第一次触发错误
                try {
                    throw new Error('Error for timeout test')
                } catch (error) {
                    console.log('[Deduplication] First error triggered')
                }

                // 6秒后再次触发相同错误
                setTimeout(() => {
                    try {
                        throw new Error('Error for timeout test')
                    } catch (error) {
                        console.log('[Deduplication] Second error triggered after 6 seconds (should be reported again)')
                    }
                }, 6000)
            },
            expectedFields: ['_deduplication', '_deduplication.count'],
            expectedValues: {
                '_deduplication.count': 1, // 第二次应该重新计数
            },
            dsnEndpoint: '附加在所有事件中',
            backendQuery: '验证上报了2次',
            frontendPage: '/errors',
        },
    ],
}

/**
 * 运行所有 Deduplication 场景
 */
export function runDeduplicationScenarios(onComplete) {
    console.log('[Deduplication Integration] Starting scenarios...')
    console.log('[Deduplication Integration] Note: Identical errors within 5 seconds will be deduplicated')

    const scenarios = DeduplicationIntegrationScenarios.scenarios
    let currentIndex = 0

    function runNext() {
        if (currentIndex >= scenarios.length) {
            console.log('[Deduplication Integration] All scenarios completed')
            if (onComplete) onComplete()
            return
        }

        const scenario = scenarios[currentIndex]
        console.log(`[Deduplication Integration] Running: ${scenario.name}`)

        try {
            scenario.trigger()
        } catch (error) {
            console.log(`[Deduplication Integration] ${scenario.name} error:`, error)
        }

        currentIndex++
        // 给足够的时间（特别是 dedup-03 需要6秒+）
        setTimeout(runNext, scenario.id === 'dedup-03' ? 8000 : 3000)
    }

    runNext()
}
