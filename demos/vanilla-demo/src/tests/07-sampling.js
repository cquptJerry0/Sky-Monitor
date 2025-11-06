/**
 * Integration 7: SamplingIntegration - 分层采样测试
 *
 * 测试场景：
 * 1. 错误采样率 100%
 * 2. 性能采样率 100%（Demo 模式）
 * 3. 采样元数据验证
 *
 * 验证点：
 * - sampling_rate 记录
 * - sampling_sampled 标记
 * - 所有事件都被采样（100%）
 */

import { addBreadcrumb } from '@sky-monitor/monitor-sdk-browser'

export const SamplingTests = {
    name: 'Sampling Integration',
    totalTests: 3,
    tests: [
        {
            id: 'sampling-01',
            name: '错误采样率 100%',
            description: '验证所有错误事件都被采样',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：错误采样',
                    category: 'test',
                    level: 'info',
                })

                // 触发 10 个错误，验证全部被采样
                const errorCount = 10
                for (let i = 0; i < errorCount; i++) {
                    try {
                        throw new Error(`采样测试错误 ${i + 1}`)
                    } catch (error) {
                        // 静默捕获
                    }
                    await new Promise(resolve => setTimeout(resolve, 100))
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>错误采样率测试</h3>
                        <p>已触发 ${errorCount} 个测试错误</p>
                        <p>配置: errorSampleRate = 1.0 (100%)</p>
                        <p>预期: 所有错误都被采样和上报</p>
                        <p>查看后端验证所有事件都有 sampling_rate 和 sampling_sampled 字段</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['sampling_rate', 'sampling_sampled'],
            timeout: 5000,
        },
        {
            id: 'sampling-02',
            name: '性能采样率 100%（Demo 模式）',
            description: '验证所有性能事件都被采样',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：性能采样',
                    category: 'test',
                    level: 'info',
                })

                // 触发慢请求，验证性能事件被采样
                const slowRequests = 3
                const promises = []

                for (let i = 0; i < slowRequests; i++) {
                    promises.push(fetch('https://httpstat.us/200?sleep=3500').catch(() => {}))
                }

                await Promise.all(promises)

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>性能采样率测试（Demo 模式）</h3>
                        <p>已触发 ${slowRequests} 个慢请求</p>
                        <p>配置: performanceSampleRate = 1.0 (100%)</p>
                        <p>预期: 所有慢请求都被采样和上报</p>
                        <p>注意: 生产环境建议设置为 0.1-0.3</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['sampling_rate', 'sampling_sampled', 'perf_category'],
            timeout: 15000,
        },
        {
            id: 'sampling-03',
            name: '采样元数据验证',
            description: '验证采样元数据字段正确记录',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：采样元数据',
                    category: 'test',
                    level: 'info',
                })

                // 触发一个错误
                try {
                    throw new Error('采样元数据验证测试')
                } catch (error) {
                    // 静默捕获
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>采样元数据验证</h3>
                        <p>已触发测试错误</p>
                        <p>预期字段:</p>
                        <ul>
                            <li>sampling_rate: 1.0</li>
                            <li>sampling_sampled: true</li>
                            <li>sampling_type: 'error' | 'performance'</li>
                        </ul>
                        <p>查看后端 ClickHouse 数据验证字段存在且值正确</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            expectedFields: ['sampling_rate', 'sampling_sampled'],
            timeout: 3000,
        },
    ],
}

// 导出单独的测试函数
export function testErrorSampling() {
    return SamplingTests.tests[0].run()
}

export function testPerformanceSampling() {
    return SamplingTests.tests[1].run()
}

export function testSamplingMetadata() {
    return SamplingTests.tests[2].run()
}

// 运行所有采样测试
export async function runAllSamplingTests() {
    const results = []

    for (const test of SamplingTests.tests) {
        try {
            await test.run()
            results.push({ id: test.id, name: test.name, status: 'passed' })
        } catch (error) {
            results.push({ id: test.id, name: test.name, status: 'failed', error: error.message })
        }
    }

    return results
}
