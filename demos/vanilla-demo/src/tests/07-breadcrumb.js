/**
 * 07-breadcrumb.js - BreadcrumbIntegration 测试
 *
 * 测试 BreadcrumbIntegration 的自动用户行为轨迹捕获功能
 *
 * 测试场景 (7个)：
 * 1. 自动捕获console日志
 * 2. 自动捕获DOM点击
 * 3. 自动捕获Fetch请求
 * 4. 自动捕获XHR请求
 * 5. 自动捕获路由变化
 * 6. 面包屑附加到错误
 * 7. 最大数量限制 (100)
 *
 * 验证字段：
 * - breadcrumbs JSON
 * - category: 'console' | 'ui' | 'http' | 'navigation'
 */

import { addBreadcrumb } from '@sky-monitor/monitor-sdk-browser'

export const BreadcrumbTests = {
    name: 'Breadcrumb Integration',
    description: '用户行为轨迹（自动捕获）',
    scenarios: [
        {
            id: 'console-capture',
            name: '自动捕获Console',
            description: 'BreadcrumbIntegration自动捕获console日志',
            run: () => {
                // 触发各种console日志
                console.log('Breadcrumb Test - console.log message')
                console.warn('Breadcrumb Test - console.warn message')
                console.error('Breadcrumb Test - console.error message')

                return 'Console breadcrumbs captured automatically'
            },
        },
        {
            id: 'dom-capture',
            name: '自动捕获DOM点击',
            description: 'BreadcrumbIntegration自动捕获DOM点击事件',
            run: () => {
                // 创建测试按钮
                const button = document.createElement('button')
                button.id = 'breadcrumb-test-button'
                button.textContent = 'Test Click'
                button.style.cssText = 'padding: 10px; margin: 10px;'
                document.body.appendChild(button)

                // 模拟点击
                button.click()

                // 清理
                setTimeout(() => button.remove(), 1000)

                return 'DOM click breadcrumb captured automatically'
            },
        },
        {
            id: 'fetch-capture',
            name: '自动捕获Fetch',
            description: 'BreadcrumbIntegration自动捕获Fetch请求',
            run: async () => {
                try {
                    await fetch('https://httpstat.us/200')
                } catch (e) {
                    // 忽略错误
                }
                return 'Fetch breadcrumb captured automatically'
            },
        },
        {
            id: 'xhr-capture',
            name: '自动捕获XHR',
            description: 'BreadcrumbIntegration自动捕获XHR请求',
            run: () => {
                return new Promise(resolve => {
                    const xhr = new XMLHttpRequest()
                    xhr.open('GET', 'https://httpstat.us/200')
                    xhr.onloadend = () => resolve('XHR breadcrumb captured automatically')
                    xhr.send()
                })
            },
        },
        {
            id: 'history-capture',
            name: '自动捕获路由变化',
            description: 'BreadcrumbIntegration自动捕获history变化',
            run: () => {
                // 模拟路由变化
                const currentPath = window.location.pathname
                history.pushState({}, '', '/test-route-1')
                history.pushState({}, '', '/test-route-2')
                history.replaceState({}, '', '/test-route-3')

                // 恢复原路径
                history.replaceState({}, '', currentPath)

                return 'History breadcrumbs captured automatically'
            },
        },
        {
            id: 'breadcrumb-on-error',
            name: '面包屑附加到错误',
            description: '验证错误事件包含面包屑',
            run: () => {
                // 先添加一些面包屑
                console.log('Before error - action 1')
                console.log('Before error - action 2')

                // 然后触发错误
                setTimeout(() => {
                    throw new Error('Breadcrumb Test - Error with breadcrumb trail')
                }, 100)

                return 'Error thrown - should include breadcrumb trail'
            },
        },
        {
            id: 'breadcrumb-limit',
            name: '面包屑数量限制',
            description: '验证最大100条面包屑限制',
            run: () => {
                // 添加大量面包屑
                for (let i = 0; i < 150; i++) {
                    addBreadcrumb({
                        message: `Breadcrumb ${i}`,
                        category: 'test',
                        level: 'info',
                    })
                }

                return 'Added 150 breadcrumbs - should be limited to 100'
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
                await new Promise(resolve => setTimeout(resolve, 500))
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

export default BreadcrumbTests
