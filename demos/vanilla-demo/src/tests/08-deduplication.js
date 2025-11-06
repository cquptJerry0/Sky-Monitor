/**
 * Integration 8: DeduplicationIntegration - 错误去重测试
 *
 * 测试场景：
 * 1. 相同错误在 5 秒内重复
 * 2. 验证去重计数累加
 * 3. 5 秒后相同错误重新上报
 *
 * 验证点：
 * - dedup_count 累加
 * - 5 秒窗口内只上报一次
 * - 5 秒后重新计数
 */

import { addBreadcrumb } from '@sky-monitor/monitor-sdk-browser'

export const DeduplicationTests = {
    name: 'Deduplication Integration',
    totalTests: 3,
    tests: [
        {
            id: 'dedup-01',
            name: '5秒内重复错误去重',
            description: '测试相同错误在时间窗口内被去重',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：错误去重',
                    category: 'test',
                    level: 'info',
                })

                const duplicateError = '去重测试-相同错误消息'
                const repeatCount = 5

                // 在 2 秒内触发 5 次相同错误
                for (let i = 0; i < repeatCount; i++) {
                    try {
                        throw new Error(duplicateError)
                    } catch (error) {
                        // 静默捕获
                    }
                    await new Promise(resolve => setTimeout(resolve, 400))
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>错误去重测试</h3>
                        <p>在 2 秒内触发了 ${repeatCount} 次相同错误</p>
                        <p>错误消息: "${duplicateError}"</p>
                        <p>去重窗口: 5 秒</p>
                        <p>预期结果:</p>
                        <ul>
                            <li>只上报 1 次到后端</li>
                            <li>dedup_count = ${repeatCount}</li>
                            <li>error_fingerprint 相同</li>
                        </ul>
                        <p>查看后端验证去重效果</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['error_fingerprint', 'dedup_count'],
            expectedDedup: true,
            timeout: 5000,
        },
        {
            id: 'dedup-02',
            name: '去重计数累加验证',
            description: '验证 dedup_count 正确累加',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：去重计数',
                    category: 'test',
                    level: 'info',
                })

                const duplicateError = '去重计数测试-累加验证'
                const repeatCount = 10

                // 快速触发 10 次相同错误
                for (let i = 0; i < repeatCount; i++) {
                    try {
                        throw new Error(duplicateError)
                    } catch (error) {
                        // 静默捕获
                    }
                    await new Promise(resolve => setTimeout(resolve, 100))
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>去重计数累加测试</h3>
                        <p>在 1 秒内触发了 ${repeatCount} 次相同错误</p>
                        <p>预期: dedup_count = ${repeatCount}</p>
                        <p>验证方法:</p>
                        <ol>
                            <li>查询后端 ClickHouse</li>
                            <li>搜索 error_message = "${duplicateError}"</li>
                            <li>检查 dedup_count 字段</li>
                            <li>确认只有 1 条记录，计数为 ${repeatCount}</li>
                        </ol>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['error_fingerprint', 'dedup_count'],
            expectedDedup: true,
            timeout: 5000,
        },
        {
            id: 'dedup-03',
            name: '5秒后重新计数',
            description: '测试时间窗口过期后重新上报',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：窗口过期',
                    category: 'test',
                    level: 'info',
                })

                const duplicateError = '去重测试-窗口过期重新计数'

                // 第一次触发
                try {
                    throw new Error(duplicateError)
                } catch (error) {
                    // 静默捕获
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>去重窗口过期测试</h3>
                        <p>第一次触发错误: "${duplicateError}"</p>
                        <p>等待 6 秒后再次触发相同错误...</p>
                        <p id="countdown">倒计时: 6 秒</p>
                        <p>预期结果:</p>
                        <ul>
                            <li>第一次: 上报 1 次，dedup_count = 1</li>
                            <li>等待 6 秒（超过 5 秒窗口）</li>
                            <li>第二次: 重新上报，dedup_count = 1</li>
                        </ul>
                    `
                }

                // 倒计时显示
                for (let i = 6; i > 0; i--) {
                    const countdownEl = document.getElementById('countdown')
                    if (countdownEl) {
                        countdownEl.textContent = `倒计时: ${i} 秒`
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }

                // 6 秒后再次触发相同错误
                try {
                    throw new Error(duplicateError)
                } catch (error) {
                    // 静默捕获
                }

                if (container) {
                    container.innerHTML += `
                        <p style="color: #10b981; font-weight: bold;">✓ 已触发第二次错误</p>
                        <p>查看后端验证有 2 条记录，每条 dedup_count = 1</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['error_fingerprint', 'dedup_count'],
            timeout: 10000,
        },
    ],
}

// 导出单独的测试函数
export function testDedupWithinWindow() {
    return DeduplicationTests.tests[0].run()
}

export function testDedupCountIncrement() {
    return DeduplicationTests.tests[1].run()
}

export function testDedupWindowExpiry() {
    return DeduplicationTests.tests[2].run()
}

// 运行所有去重测试
export async function runAllDeduplicationTests() {
    const results = []

    for (const test of DeduplicationTests.tests) {
        try {
            await test.run()
            results.push({ id: test.id, name: test.name, status: 'passed' })
        } catch (error) {
            results.push({ id: test.id, name: test.name, status: 'failed', error: error.message })
        }
    }

    return results
}
