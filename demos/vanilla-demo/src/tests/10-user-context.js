/**
 * 手动功能 2: User Context - 用户上下文测试
 *
 * 测试场景：
 * 1. 设置用户信息（setUser）
 * 2. 设置标签（setTag）
 * 3. 设置额外数据（setExtra）
 * 4. 验证所有事件附加用户上下文
 *
 * 验证点：
 * - user_id 正确
 * - user_email 正确
 * - user_username 正确
 * - tags JSON 包含标签
 * - extra JSON 包含额外数据
 */

import { setUser, setTag, configureScope, addBreadcrumb } from '@sky-monitor/monitor-sdk-browser'

export const UserContextTests = {
    name: 'User Context (Manual)',
    totalTests: 4,
    tests: [
        {
            id: 'user-context-01',
            name: '设置用户信息',
            description: '测试 setUser 功能',
            run: async () => {
                // 设置用户信息
                setUser({
                    id: 'test_user_001',
                    username: 'test_user',
                    email: 'test@example.com',
                    extra: {
                        role: 'admin',
                        department: 'Engineering',
                    },
                })

                addBreadcrumb({
                    message: '已设置用户信息',
                    category: 'user-context',
                    level: 'info',
                })

                // 触发错误以验证用户信息附加
                try {
                    throw new Error('用户信息测试 - 验证 setUser')
                } catch (error) {
                    // 静默捕获
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>设置用户信息测试</h3>
                        <p>已设置用户信息:</p>
                        <ul>
                            <li>user_id: test_user_001</li>
                            <li>username: test_user</li>
                            <li>email: test@example.com</li>
                            <li>role: admin</li>
                            <li>department: Engineering</li>
                        </ul>
                        <p>触发错误后，查看后端验证这些字段都正确记录</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['user_id', 'user_username', 'user_email'],
            timeout: 2000,
        },
        {
            id: 'user-context-02',
            name: '设置标签',
            description: '测试 setTag 功能',
            run: async () => {
                // 设置多个标签
                setTag('environment', 'test')
                setTag('version', '1.0.0-demo')
                setTag('feature', 'user-context-test')
                setTag('region', 'us-west-1')

                addBreadcrumb({
                    message: '已设置 4 个标签',
                    category: 'user-context',
                    level: 'info',
                })

                // 触发错误
                try {
                    throw new Error('标签测试 - 验证 setTag')
                } catch (error) {
                    // 静默捕获
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>设置标签测试</h3>
                        <p>已设置 4 个标签:</p>
                        <ul>
                            <li>environment: test</li>
                            <li>version: 1.0.0-demo</li>
                            <li>feature: user-context-test</li>
                            <li>region: us-west-1</li>
                        </ul>
                        <p>预期: 所有事件的 tags JSON 字段包含这些标签</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['tags'],
            timeout: 2000,
        },
        {
            id: 'user-context-03',
            name: '设置额外数据',
            description: '测试 setExtra/configureScope 功能',
            run: async () => {
                // 使用 configureScope 设置额外数据
                configureScope(scope => {
                    scope.setExtra('request_id', 'req_12345')
                    scope.setExtra('session_duration', '15 minutes')
                    scope.setExtra('page_views', 10)
                    scope.setExtra('custom_data', {
                        feature_flags: ['new_ui', 'beta_feature'],
                        experiment_id: 'exp_001',
                    })
                })

                addBreadcrumb({
                    message: '已设置额外数据',
                    category: 'user-context',
                    level: 'info',
                })

                // 触发错误
                try {
                    throw new Error('额外数据测试 - 验证 setExtra')
                } catch (error) {
                    // 静默捕获
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>设置额外数据测试</h3>
                        <p>已设置额外数据:</p>
                        <ul>
                            <li>request_id: req_12345</li>
                            <li>session_duration: 15 minutes</li>
                            <li>page_views: 10</li>
                            <li>custom_data: { feature_flags, experiment_id }</li>
                        </ul>
                        <p>预期: 所有事件的 extra JSON 字段包含这些数据</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['extra'],
            timeout: 2000,
        },
        {
            id: 'user-context-04',
            name: '用户上下文附加到所有事件',
            description: '验证用户上下文会附加到所有类型的事件',
            run: async () => {
                // 设置完整的用户上下文
                setUser({
                    id: 'context_test_user',
                    username: 'context_tester',
                    email: 'context@test.com',
                })

                setTag('test_type', 'integration')
                setTag('suite', 'user-context')

                configureScope(scope => {
                    scope.setExtra('test_id', 'ctx_004')
                })

                addBreadcrumb({
                    message: '完整用户上下文已设置',
                    category: 'test',
                    level: 'info',
                })

                // 触发不同类型的事件

                // 1. 错误事件
                try {
                    throw new Error('上下文测试 - 错误事件')
                } catch (error) {
                    // 静默捕获
                }

                await new Promise(resolve => setTimeout(resolve, 200))

                // 2. HTTP 错误
                try {
                    await fetch('https://httpstat.us/404')
                } catch (error) {
                    // 忽略
                }

                await new Promise(resolve => setTimeout(resolve, 200))

                // 3. 资源错误
                const img = new Image()
                img.src = 'https://nonexistent-domain-test-12345.com/context-test.png'

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>用户上下文全局附加测试</h3>
                        <p>已设置完整用户上下文:</p>
                        <ul>
                            <li>User: context_test_user (context@test.com)</li>
                            <li>Tags: test_type=integration, suite=user-context</li>
                            <li>Extra: test_id=ctx_004</li>
                        </ul>
                        <p>触发了 3 种类型的事件:</p>
                        <ul>
                            <li>错误事件</li>
                            <li>HTTP 错误</li>
                            <li>资源错误</li>
                        </ul>
                        <p>预期: 查询后端，所有 3 个事件都包含相同的用户上下文</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            expectedFields: ['user_id', 'tags', 'extra'],
            timeout: 5000,
        },
    ],
}

// 导出单独的测试函数
export function testSetUser() {
    return UserContextTests.tests[0].run()
}

export function testSetTag() {
    return UserContextTests.tests[1].run()
}

export function testSetExtra() {
    return UserContextTests.tests[2].run()
}

export function testGlobalContextAttachment() {
    return UserContextTests.tests[3].run()
}

// 运行所有用户上下文测试
export async function runAllUserContextTests() {
    const results = []

    for (const test of UserContextTests.tests) {
        try {
            await test.run()
            results.push({ id: test.id, name: test.name, status: 'passed' })
        } catch (error) {
            results.push({ id: test.id, name: test.name, status: 'failed', error: error.message })
        }
    }

    return results
}
