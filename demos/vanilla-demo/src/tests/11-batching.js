/**
 * 批量和离线 1: Batching - 批量上报测试
 *
 * 测试场景：
 * 1. 快速触发 25 个事件
 * 2. 验证批量上报（20 个一批）
 * 3. 验证刷新间隔（5 秒）
 *
 * 验证点：
 * - 后端收到批量请求
 * - 批次大小符合配置
 * - 剩余 5 个事件在 5 秒后发送
 */

import { addBreadcrumb } from '@sky-monitor/monitor-sdk-browser'

export const BatchingTests = {
    name: 'Batching',
    totalTests: 3,
    tests: [
        {
            id: 'batching-01',
            name: '快速触发多个事件',
            description: '快速触发 25 个事件，测试批量上报',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：批量上报',
                    category: 'test',
                    level: 'info',
                })

                const eventCount = 25

                // 快速触发 25 个面包屑事件
                for (let i = 0; i < eventCount; i++) {
                    addBreadcrumb({
                        message: `批量测试事件 ${i + 1}`,
                        category: 'batch-test',
                        level: 'info',
                        data: { index: i + 1 },
                    })
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>批量上报测试</h3>
                        <p>已快速触发 ${eventCount} 个事件</p>
                        <p>批量配置:</p>
                        <ul>
                            <li>batchSize: 20 条/批</li>
                            <li>flushInterval: 5 秒</li>
                        </ul>
                        <p>预期行为:</p>
                        <ul>
                            <li>前 20 个事件立即作为一批发送</li>
                            <li>剩余 5 个事件等待 5 秒后发送</li>
                        </ul>
                        <p>验证方法: 查看浏览器 Network 面板，观察批量请求</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            expectedBatches: 2,
            timeout: 3000,
        },
        {
            id: 'batching-02',
            name: '验证批次大小',
            description: '验证批量请求的大小符合配置',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：批次大小',
                    category: 'test',
                    level: 'info',
                })

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>批次大小验证</h3>
                        <p>批量配置: batchSize = 20</p>
                        <p>验证步骤:</p>
                        <ol>
                            <li>打开浏览器开发者工具 → Network 面板</li>
                            <li>触发 25 个事件（运行批量测试 01）</li>
                            <li>查找 POST 请求到 /api/monitoring/*/batch</li>
                            <li>查看请求 Payload，确认第一批有 20 个事件</li>
                            <li>等待 5 秒，确认第二批有 5 个事件</li>
                        </ol>
                        <p>也可以在后端日志中验证批量大小</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            timeout: 3000,
        },
        {
            id: 'batching-03',
            name: '验证刷新间隔',
            description: '验证刷新间隔（5 秒）正确执行',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：刷新间隔',
                    category: 'test',
                    level: 'info',
                })

                // 触发 10 个事件（少于批次大小）
                for (let i = 0; i < 10; i++) {
                    addBreadcrumb({
                        message: `刷新间隔测试事件 ${i + 1}`,
                        category: 'flush-test',
                        level: 'info',
                    })
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>刷新间隔验证</h3>
                        <p>已触发 10 个事件（少于 batchSize 20）</p>
                        <p>配置: flushInterval = 5 秒</p>
                        <p>预期: 这 10 个事件会在 5 秒后自动发送</p>
                        <p id="flush-countdown">倒计时: 5 秒</p>
                        <p>验证方法: 观察 Network 面板，5 秒后会看到批量请求</p>
                    `
                }

                // 倒计时显示
                for (let i = 5; i > 0; i--) {
                    const countdownEl = document.getElementById('flush-countdown')
                    if (countdownEl) {
                        countdownEl.textContent = `倒计时: ${i} 秒`
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }

                if (container) {
                    const existingContent = container.innerHTML
                    container.innerHTML =
                        existingContent +
                        `
                        <p style="color: #10b981; font-weight: bold;">✓ 刷新间隔已到，事件应该已发送</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            timeout: 8000,
        },
    ],
}

// 导出单独的测试函数
export function testBatchTrigger() {
    return BatchingTests.tests[0].run()
}

export function testBatchSize() {
    return BatchingTests.tests[1].run()
}

export function testFlushInterval() {
    return BatchingTests.tests[2].run()
}

// 运行所有批量测试
export async function runAllBatchingTests() {
    const results = []

    for (const test of BatchingTests.tests) {
        try {
            await test.run()
            results.push({ id: test.id, name: test.name, status: 'passed' })
        } catch (error) {
            results.push({ id: test.id, name: test.name, status: 'failed', error: error.message })
        }
    }

    return results
}
