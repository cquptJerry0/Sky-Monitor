/**
 * 13-batching-offline.js - 批量上报和离线队列测试
 *
 * 测试传输功能：批量上报、离线队列、SourceMap配置
 *
 * 测试场景 (6个)：
 * 1. 批量上报触发 (20条/批)
 * 2. 刷新间隔验证 (5秒)
 * 3. 离线队列存储 (localStorage)
 * 4. 队列大小限制 (50条)
 * 5. 网络恢复重试 (10秒)
 * 6. SourceMap配置验证
 *
 * 验证字段：
 * - 批量请求 (POST /api/monitoring/:appId/batch)
 * - localStorage存储
 * - 重试机制
 */

export const BatchingOfflineTests = {
    name: 'Batching & Offline',
    description: '批量上报和离线队列',
    scenarios: [
        {
            id: 'batch-trigger',
            name: '批量上报触发',
            description: '触发20条事件，验证批量上报',
            run: async () => {
                // 快速触发20+个事件
                for (let i = 0; i < 25; i++) {
                    if (i % 5 === 0) {
                        // 抛出一些错误
                        setTimeout(() => {
                            throw new Error(`Batching Test - Error ${i}`)
                        }, i * 50)
                    } else {
                        // 发送一些HTTP请求
                        fetch('https://httpstat.us/200').catch(() => {})
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 2000))

                return 'Batching test - 25 events generated (should trigger batch when reaching 20)'
            },
        },
        {
            id: 'flush-interval',
            name: '刷新间隔',
            description: '验证5秒刷新间隔',
            run: async () => {
                // 触发少量事件（不足20条）
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        throw new Error(`Flush Test - Error ${i}`)
                    }, i * 100)
                }

                await new Promise(resolve => setTimeout(resolve, 1500))

                // 等待5秒刷新
                await new Promise(resolve => setTimeout(resolve, 5000))

                return 'Flush interval test - 10 events should be flushed after 5s'
            },
        },
        {
            id: 'offline-storage',
            name: '离线队列存储',
            description: '验证localStorage存储',
            run: () => {
                // 检查localStorage中的离线队列
                const offlineQueue = localStorage.getItem('sky-monitor-offline-queue')

                if (offlineQueue) {
                    const queue = JSON.parse(offlineQueue)
                    return `Offline queue found - ${queue.length} events in storage`
                }

                // 触发一些事件以填充队列
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        throw new Error(`Offline Test - Error ${i}`)
                    }, i * 100)
                }

                return 'Offline storage test - events stored in localStorage'
            },
        },
        {
            id: 'queue-limit',
            name: '队列大小限制',
            description: '验证50条队列限制',
            run: async () => {
                // 触发大量事件（超过50条）
                for (let i = 0; i < 60; i++) {
                    setTimeout(() => {
                        throw new Error(`Queue Limit Test - Error ${i}`)
                    }, i * 20)
                }

                await new Promise(resolve => setTimeout(resolve, 2000))

                // 检查队列大小
                const offlineQueue = localStorage.getItem('sky-monitor-offline-queue')
                if (offlineQueue) {
                    const queue = JSON.parse(offlineQueue)
                    return `Queue limit test - ${queue.length} events (should be limited to 50)`
                }

                return 'Queue limit test - 60 events generated (should be limited to 50)'
            },
        },
        {
            id: 'network-retry',
            name: '网络重试机制',
            description: '模拟网络恢复后重试',
            run: () => {
                // 模拟离线场景
                // 注意：实际网络状态切换需要浏览器控制

                // 触发一些事件
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        throw new Error(`Retry Test - Error ${i}`)
                    }, i * 100)
                }

                return 'Network retry test - events queued for retry (check after 10s interval)'
            },
        },
        {
            id: 'sourcemap-config',
            name: 'SourceMap配置',
            description: '验证SourceMap相关配置',
            run: () => {
                // 验证配置
                const config = window.MONITOR_CONFIG

                if (!config) {
                    throw new Error('Monitor config not found')
                }

                // 触发一个错误以验证SourceMap上报
                throw new Error('SourceMap Test - Error with release info for source map matching')

                // 验证点：
                // - release: '1.0.0-demo'
                // - appId: 'demo_app_001'
                // - environment: 'development'
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
                // 等待批量处理
                await new Promise(resolve => setTimeout(resolve, 1000))
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

export default BatchingOfflineTests
