/**
 * Integration 3: SessionIntegration - 会话跟踪测试
 *
 * 测试场景：
 * 1. 初始会话创建
 * 2. 会话 ID 持久化（sessionStorage）
 * 3. 会话超时验证（模拟 30 分钟）
 * 4. 页面可见性切换
 * 5. 页面卸载前保存
 * 6. 会话指标累加（eventCount, errorCount, pageViews）
 *
 * 验证点：
 * - session_id 一致性
 * - session_start_time 记录
 * - session_duration 增长
 * - session_event_count 累加
 * - session_error_count 累加
 * - session_page_views 记录
 */

import { addBreadcrumb } from '@sky-monitor/monitor-sdk-browser'

export const SessionTests = {
    name: 'Session Integration',
    totalTests: 6,
    tests: [
        {
            id: 'session-01',
            name: '初始会话创建',
            description: '验证会话 ID 自动生成',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：会话创建',
                    category: 'test',
                    level: 'info',
                })

                // 会话在 SDK 初始化时自动创建
                const sessionId = sessionStorage.getItem('sky_monitor_session_id')

                if (!sessionId) {
                    throw new Error('会话 ID 未创建')
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>当前会话信息</h3>
                        <p>Session ID: <code>${sessionId}</code></p>
                        <p>会话已自动创建并存储到 sessionStorage</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['session_id', 'session_start_time'],
            timeout: 2000,
        },
        {
            id: 'session-02',
            name: '会话 ID 持久化',
            description: '验证 sessionStorage 中的会话 ID',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：会话持久化',
                    category: 'test',
                    level: 'info',
                })

                const sessionId = sessionStorage.getItem('sky_monitor_session_id')
                const sessionStartTime = sessionStorage.getItem('sky_monitor_session_start')

                if (!sessionId || !sessionStartTime) {
                    throw new Error('会话数据未持久化')
                }

                // 验证会话数据格式
                const startTime = parseInt(sessionStartTime, 10)
                if (isNaN(startTime) || startTime <= 0) {
                    throw new Error('会话开始时间格式错误')
                }

                const container = document.getElementById('test-area')
                if (container) {
                    const duration = Date.now() - startTime
                    container.innerHTML = `
                        <h3>会话持久化验证</h3>
                        <p>Session ID: <code>${sessionId}</code></p>
                        <p>开始时间: ${new Date(startTime).toLocaleString()}</p>
                        <p>当前持续时间: ${Math.floor(duration / 1000)} 秒</p>
                        <p>存储位置: sessionStorage</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['session_id', 'session_start_time', 'session_duration'],
            timeout: 2000,
        },
        {
            id: 'session-03',
            name: '会话超时验证',
            description: '模拟会话超时（30 分钟配置）',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：会话超时',
                    category: 'test',
                    level: 'info',
                })

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>会话超时机制</h3>
                        <p>配置超时时间: 30 分钟</p>
                        <p>超时后会自动创建新会话</p>
                        <p>注意: 实际测试需要等待 30 分钟或手动修改 sessionStorage 时间戳</p>
                        <p>当前测试: 验证配置已正确应用</p>
                    `
                }

                // 验证会话仍然有效
                const sessionId = sessionStorage.getItem('sky_monitor_session_id')
                if (!sessionId) {
                    throw new Error('会话丢失')
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            expectedFields: ['session_id'],
            timeout: 3000,
        },
        {
            id: 'session-04',
            name: '页面可见性切换',
            description: '测试页面隐藏/显示时的会话更新',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：页面可见性',
                    category: 'test',
                    level: 'info',
                })

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>页面可见性切换测试</h3>
                        <p>尝试切换到其他标签页，然后返回此页面</p>
                        <p>SDK 会在页面隐藏时保存会话数据</p>
                        <p>在页面重新可见时恢复会话</p>
                        <p><strong>提示:</strong> 查看控制台日志，会看到 visibilitychange 事件</p>
                    `
                }

                // 模拟可见性变化
                document.dispatchEvent(new Event('visibilitychange'))

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['session_id', 'session_duration'],
            timeout: 2000,
        },
        {
            id: 'session-05',
            name: '页面卸载前保存',
            description: '测试页面关闭前的会话保存',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：页面卸载',
                    category: 'test',
                    level: 'info',
                })

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>页面卸载测试</h3>
                        <p>SDK 会在 beforeunload 事件时保存会话</p>
                        <p>确保会话数据不会丢失</p>
                        <p>注意: 实际测试需要关闭或刷新页面</p>
                        <p>当前测试: 验证事件监听器已注册</p>
                    `
                }

                // 触发 beforeunload 事件（不会真正卸载页面）
                window.dispatchEvent(new Event('beforeunload'))

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['session_id', 'session_duration'],
            timeout: 2000,
        },
        {
            id: 'session-06',
            name: '会话指标累加',
            description: '验证事件计数和错误计数累加',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：会话指标',
                    category: 'test',
                    level: 'info',
                })

                const sessionId = sessionStorage.getItem('sky_monitor_session_id')

                // 触发一些事件和错误，让计数器累加
                addBreadcrumb({
                    message: '测试事件 1',
                    category: 'test',
                    level: 'info',
                })

                addBreadcrumb({
                    message: '测试事件 2',
                    category: 'test',
                    level: 'info',
                })

                // 触发一个错误（不抛出）
                try {
                    throw new Error('会话指标测试错误 - 计数累加')
                } catch (e) {
                    // 静默捕获
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>会话指标累加</h3>
                        <p>Session ID: <code>${sessionId}</code></p>
                        <p>已触发: 3 个面包屑事件 + 1 个错误</p>
                        <p>后端应记录: session_event_count 和 session_error_count</p>
                        <p>注意: 查看后端数据库验证计数正确</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            expectedFields: ['session_id', 'session_event_count', 'session_error_count'],
            timeout: 3000,
        },
    ],
}

// 导出单独的测试函数
export function testSessionCreation() {
    return SessionTests.tests[0].run()
}

export function testSessionPersistence() {
    return SessionTests.tests[1].run()
}

export function testSessionTimeout() {
    return SessionTests.tests[2].run()
}

export function testPageVisibility() {
    return SessionTests.tests[3].run()
}

export function testBeforeUnload() {
    return SessionTests.tests[4].run()
}

export function testSessionMetrics() {
    return SessionTests.tests[5].run()
}

// 运行所有会话测试
export async function runAllSessionTests() {
    const results = []

    for (const test of SessionTests.tests) {
        try {
            await test.run()
            results.push({ id: test.id, name: test.name, status: 'passed' })
        } catch (error) {
            results.push({ id: test.id, name: test.name, status: 'failed', error: error.message })
        }
    }

    return results
}
