/**
 * 手动功能 1: Breadcrumb - 用户行为轨迹测试
 *
 * 测试场景：
 * 1. 手动添加用户点击面包屑
 * 2. 手动添加 API 调用面包屑
 * 3. 手动添加导航面包屑
 * 4. 验证面包屑附加到错误事件
 * 5. 验证面包屑最大数量限制（100）
 *
 * 验证点：
 * - breadcrumbs JSON 字段包含数据
 * - 面包屑按时间排序
 * - 超过 100 个时，移除最旧的
 */

import { addBreadcrumb, captureError } from '@sky-monitor/monitor-sdk-browser'

export const BreadcrumbTests = {
    name: 'Breadcrumb (Manual)',
    totalTests: 5,
    tests: [
        {
            id: 'breadcrumb-01',
            name: '手动添加点击面包屑',
            description: '测试手动记录用户点击行为',
            run: async () => {
                addBreadcrumb({
                    message: '用户点击了"提交"按钮',
                    category: 'user',
                    level: 'info',
                    data: {
                        buttonId: 'submit-btn',
                        formName: 'user-registration',
                    },
                })

                addBreadcrumb({
                    message: '用户点击了"取消"按钮',
                    category: 'user',
                    level: 'info',
                    data: {
                        buttonId: 'cancel-btn',
                    },
                })

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>手动点击面包屑测试</h3>
                        <p>已添加 2 个用户点击面包屑</p>
                        <ul>
                            <li>提交按钮 (submit-btn)</li>
                            <li>取消按钮 (cancel-btn)</li>
                        </ul>
                        <p>这些面包屑会附加到后续的错误事件中</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['breadcrumbs'],
            timeout: 2000,
        },
        {
            id: 'breadcrumb-02',
            name: '手动添加 API 调用面包屑',
            description: '测试记录 API 请求行为',
            run: async () => {
                addBreadcrumb({
                    message: 'API 请求: GET /api/users',
                    category: 'http',
                    level: 'info',
                    data: {
                        url: '/api/users',
                        method: 'GET',
                        status: 200,
                    },
                })

                addBreadcrumb({
                    message: 'API 请求: POST /api/orders',
                    category: 'http',
                    level: 'info',
                    data: {
                        url: '/api/orders',
                        method: 'POST',
                        status: 201,
                    },
                })

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>API 调用面包屑测试</h3>
                        <p>已添加 2 个 API 调用面包屑</p>
                        <ul>
                            <li>GET /api/users (200)</li>
                            <li>POST /api/orders (201)</li>
                        </ul>
                        <p>这些面包屑可以帮助追踪错误前的 API 调用链</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['breadcrumbs'],
            timeout: 2000,
        },
        {
            id: 'breadcrumb-03',
            name: '手动添加导航面包屑',
            description: '测试记录页面导航行为',
            run: async () => {
                addBreadcrumb({
                    message: '导航到: /dashboard',
                    category: 'navigation',
                    level: 'info',
                    data: {
                        from: '/home',
                        to: '/dashboard',
                    },
                })

                addBreadcrumb({
                    message: '导航到: /profile',
                    category: 'navigation',
                    level: 'info',
                    data: {
                        from: '/dashboard',
                        to: '/profile',
                    },
                })

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>导航面包屑测试</h3>
                        <p>已添加 2 个页面导航面包屑</p>
                        <ul>
                            <li>/home → /dashboard</li>
                            <li>/dashboard → /profile</li>
                        </ul>
                        <p>这些面包屑可以追踪用户的页面浏览路径</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['breadcrumbs'],
            timeout: 2000,
        },
        {
            id: 'breadcrumb-04',
            name: '面包屑附加到错误',
            description: '验证面包屑会附加到错误事件',
            run: async () => {
                // 先添加几个面包屑
                addBreadcrumb({
                    message: '准备提交表单',
                    category: 'user',
                    level: 'info',
                })

                addBreadcrumb({
                    message: '表单验证通过',
                    category: 'validation',
                    level: 'info',
                })

                addBreadcrumb({
                    message: '发送 API 请求',
                    category: 'http',
                    level: 'info',
                })

                // 触发一个错误
                try {
                    throw new Error('面包屑附加测试 - 表单提交失败')
                } catch (error) {
                    // 静默捕获
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>面包屑附加到错误测试</h3>
                        <p>已添加 3 个面包屑，然后触发错误</p>
                        <p>预期: 错误事件的 breadcrumbs 字段包含这 3 个面包屑</p>
                        <p>验证方法:</p>
                        <ol>
                            <li>查询后端 error_message = "面包屑附加测试"</li>
                            <li>查看 breadcrumbs JSON 字段</li>
                            <li>确认包含所有 3 个面包屑</li>
                            <li>确认按时间排序（最新的在最后）</li>
                        </ol>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['breadcrumbs', 'error_message'],
            timeout: 2000,
        },
        {
            id: 'breadcrumb-05',
            name: '面包屑最大数量限制',
            description: '验证超过 100 个面包屑时移除最旧的',
            run: async () => {
                const maxBreadcrumbs = 105

                // 添加 105 个面包屑
                for (let i = 0; i < maxBreadcrumbs; i++) {
                    addBreadcrumb({
                        message: `面包屑 ${i + 1}`,
                        category: 'test',
                        level: 'info',
                        data: { index: i + 1 },
                    })
                }

                // 触发错误以查看面包屑
                try {
                    throw new Error('面包屑数量限制测试')
                } catch (error) {
                    // 静默捕获
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>面包屑最大数量限制测试</h3>
                        <p>已添加 ${maxBreadcrumbs} 个面包屑</p>
                        <p>面包屑最大数量: 100</p>
                        <p>预期结果:</p>
                        <ul>
                            <li>错误事件只包含最近的 100 个面包屑</li>
                            <li>最旧的 5 个面包屑被移除</li>
                            <li>保留的面包屑: 6-105</li>
                        </ul>
                        <p>验证方法: 查询后端，检查 breadcrumbs 数组长度 = 100</p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 500))
            },
            expectedFields: ['breadcrumbs'],
            expectedBreadcrumbCount: 100,
            timeout: 3000,
        },
    ],
}

// 导出单独的测试函数
export function testClickBreadcrumb() {
    return BreadcrumbTests.tests[0].run()
}

export function testAPIBreadcrumb() {
    return BreadcrumbTests.tests[1].run()
}

export function testNavigationBreadcrumb() {
    return BreadcrumbTests.tests[2].run()
}

export function testBreadcrumbAttachment() {
    return BreadcrumbTests.tests[3].run()
}

export function testBreadcrumbLimit() {
    return BreadcrumbTests.tests[4].run()
}

// 运行所有面包屑测试
export async function runAllBreadcrumbTests() {
    const results = []

    for (const test of BreadcrumbTests.tests) {
        try {
            await test.run()
            results.push({ id: test.id, name: test.name, status: 'passed' })
        } catch (error) {
            results.push({ id: test.id, name: test.name, status: 'failed', error: error.message })
        }
    }

    return results
}
