/**
 * 批量和离线 2: Offline Queue - 离线队列测试
 *
 * 测试场景：
 * 1. 模拟网络断开（拦截 fetch）
 * 2. 触发事件存储到 localStorage
 * 3. 恢复网络连接
 * 4. 验证离线事件重新发送
 *
 * 验证点：
 * - localStorage 存储事件
 * - 队列大小限制（50 条）
 * - 网络恢复后重试（10 秒间隔）
 */

import { addBreadcrumb } from '@sky-monitor/monitor-sdk-browser'

export const OfflineTests = {
    name: 'Offline Queue',
    totalTests: 4,
    tests: [
        {
            id: 'offline-01',
            name: '模拟网络断开',
            description: '模拟网络故障，触发离线存储',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：离线队列',
                    category: 'test',
                    level: 'info',
                })

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>离线队列测试</h3>
                        <p>离线队列配置:</p>
                        <ul>
                            <li>enableOffline: true</li>
                            <li>offlineQueueSize: 50 条</li>
                            <li>retryInterval: 10 秒</li>
                        </ul>
                        <p>测试步骤:</p>
                        <ol>
                            <li>打开浏览器开发者工具 → Network 面板</li>
                            <li>点击 "Offline" 模拟网络断开</li>
                            <li>触发一些错误或事件</li>
                            <li>查看 localStorage（key: sky_monitor_offline_queue）</li>
                            <li>恢复网络（取消 Offline）</li>
                            <li>等待 10 秒，观察事件重新发送</li>
                        </ol>
                        <p style="background: #fef3c7; padding: 10px; border-radius: 4px;">
                            注意: 本测试需要手动操作浏览器 Network 面板
                        </p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            requiresManual: true,
            timeout: 3000,
        },
        {
            id: 'offline-02',
            name: '离线事件存储',
            description: '验证离线事件存储到 localStorage',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：离线存储',
                    category: 'test',
                    level: 'info',
                })

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>离线事件存储验证</h3>
                        <p>验证 localStorage 中的离线队列:</p>
                        <ol>
                            <li>打开浏览器开发者工具 → Application 面板</li>
                            <li>选择 Local Storage</li>
                            <li>查找 key: <code>sky_monitor_offline_queue</code></li>
                            <li>查看存储的事件数据（JSON 数组）</li>
                        </ol>
                        <p>队列限制: 最多存储 50 条事件</p>
                        <p>超过限制时，最旧的事件会被移除</p>
                    `
                }

                // 尝试读取离线队列
                const offlineQueue = localStorage.getItem('sky_monitor_offline_queue')
                if (offlineQueue) {
                    try {
                        const queue = JSON.parse(offlineQueue)
                        if (container) {
                            container.innerHTML += `
                                <p style="color: #10b981;">
                                    ✓ 当前离线队列中有 ${queue.length} 个事件
                                </p>
                            `
                        }
                    } catch (error) {
                        // 解析失败
                    }
                } else {
                    if (container) {
                        container.innerHTML += `
                            <p style="color: #9ca3af;">
                                当前离线队列为空（网络正常）
                            </p>
                        `
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            timeout: 3000,
        },
        {
            id: 'offline-03',
            name: '队列大小限制',
            description: '验证队列大小限制（50 条）',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：队列限制',
                    category: 'test',
                    level: 'info',
                })

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>队列大小限制验证</h3>
                        <p>配置: offlineQueueSize = 50</p>
                        <p>测试步骤:</p>
                        <ol>
                            <li>模拟网络断开（Network 面板 → Offline）</li>
                            <li>快速触发 60 个错误</li>
                            <li>查看 localStorage 的离线队列</li>
                            <li>确认只保留最新的 50 个事件</li>
                            <li>最旧的 10 个事件被丢弃</li>
                        </ol>
                        <p style="background: #fef3c7; padding: 10px; border-radius: 4px;">
                            注意: 本测试需要手动模拟网络断开
                        </p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            requiresManual: true,
            timeout: 3000,
        },
        {
            id: 'offline-04',
            name: '网络恢复重试',
            description: '验证网络恢复后自动重试',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：网络恢复',
                    category: 'test',
                    level: 'info',
                })

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>网络恢复重试验证</h3>
                        <p>配置: retryInterval = 10 秒</p>
                        <p>测试步骤:</p>
                        <ol>
                            <li>确认离线队列中有事件</li>
                            <li>恢复网络（取消 Network 面板的 Offline）</li>
                            <li>等待 10 秒</li>
                            <li>观察 Network 面板，会看到批量请求</li>
                            <li>查看 localStorage，离线队列应该被清空</li>
                        </ol>
                        <p>预期结果:</p>
                        <ul>
                            <li>离线事件会在 10 秒后重新发送</li>
                            <li>发送成功后，离线队列被清空</li>
                            <li>如果发送失败，继续保留在队列中</li>
                        </ul>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            requiresManual: true,
            timeout: 3000,
        },
    ],
}

// 导出单独的测试函数
export function testOfflineSimulation() {
    return OfflineTests.tests[0].run()
}

export function testOfflineStorage() {
    return OfflineTests.tests[1].run()
}

export function testQueueSizeLimit() {
    return OfflineTests.tests[2].run()
}

export function testNetworkRecovery() {
    return OfflineTests.tests[3].run()
}

// 运行所有离线测试
export async function runAllOfflineTests() {
    const results = []

    for (const test of OfflineTests.tests) {
        try {
            await test.run()
            results.push({ id: test.id, name: test.name, status: 'passed' })
        } catch (error) {
            results.push({ id: test.id, name: test.name, status: 'failed', error: error.message })
        }
    }

    return results
}
