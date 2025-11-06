/**
 * 12-user-context.js - 用户上下文测试
 *
 * 测试手动功能：setUser, setTag, setExtra, configureScope, addBreadcrumb
 *
 * 测试场景 (5个)：
 * 1. setUser() 设置用户信息
 * 2. setTag() 设置标签
 * 3. setExtra() 设置额外数据
 * 4. configureScope() 配置作用域
 * 5. addBreadcrumb() 手动添加面包屑
 *
 * 验证字段：
 * - user_id
 * - user_email
 * - user_username
 * - tags JSON
 * - extra JSON
 * - breadcrumbs JSON
 */

import { setUser, setTag, addBreadcrumb, configureScope } from '@sky-monitor/monitor-sdk-browser'

export const UserContextTests = {
    name: 'User Context',
    description: '用户上下文和手动功能',
    scenarios: [
        {
            id: 'set-user',
            name: 'setUser()',
            description: '设置用户信息',
            run: () => {
                setUser({
                    id: 'test_user_' + Date.now(),
                    username: 'test_user',
                    email: 'test@example.com',
                    ip_address: '127.0.0.1',
                })

                // 触发一个事件验证用户信息附加
                throw new Error('User Context Test - Error with user info')
            },
        },
        {
            id: 'set-tag',
            name: 'setTag()',
            description: '设置标签',
            run: () => {
                setTag('test_type', 'user-context-test')
                setTag('test_scenario', 'set-tag')
                setTag('build_number', '12345')

                // 触发事件验证标签附加
                throw new Error('User Context Test - Error with tags')
            },
        },
        {
            id: 'configure-scope',
            name: 'configureScope()',
            description: '配置作用域（添加extra数据）',
            run: () => {
                configureScope(scope => {
                    scope.setExtra('extra_field_1', 'extra_value_1')
                    scope.setExtra('extra_field_2', { nested: 'object', count: 42 })
                    scope.setExtra('extra_array', [1, 2, 3, 4, 5])
                })

                // 触发事件验证extra数据附加
                throw new Error('User Context Test - Error with extra data')
            },
        },
        {
            id: 'add-breadcrumb-manual',
            name: 'addBreadcrumb()',
            description: '手动添加面包屑',
            run: () => {
                // 手动添加多个面包屑
                addBreadcrumb({
                    message: 'User started checkout process',
                    category: 'user-action',
                    level: 'info',
                    data: {
                        cart_items: 3,
                        total_amount: 99.99,
                    },
                })

                addBreadcrumb({
                    message: 'Payment form submitted',
                    category: 'user-action',
                    level: 'info',
                    data: {
                        payment_method: 'credit_card',
                    },
                })

                addBreadcrumb({
                    message: 'Payment validation started',
                    category: 'api',
                    level: 'info',
                })

                // 触发错误，验证面包屑附加
                throw new Error('User Context Test - Error with manual breadcrumbs')
            },
        },
        {
            id: 'combined-context',
            name: '综合上下文',
            description: '验证所有上下文信息组合',
            run: () => {
                // 设置完整的用户上下文
                setUser({
                    id: 'combined_test_user',
                    username: 'combined_test',
                    email: 'combined@example.com',
                })

                setTag('test_suite', 'combined_context')
                setTag('priority', 'high')

                configureScope(scope => {
                    scope.setExtra('test_metadata', {
                        environment: 'test',
                        timestamp: Date.now(),
                        test_run_id: 'run_' + Date.now(),
                    })
                })

                addBreadcrumb({
                    message: 'Combined context test started',
                    category: 'test',
                    level: 'info',
                })

                // 触发错误，验证所有上下文
                throw new Error('User Context Test - Combined context error (should include user, tags, extra, breadcrumbs)')
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

export default UserContextTests
