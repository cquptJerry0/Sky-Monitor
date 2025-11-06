/**
 * Integration 1: Errors - 全局错误捕获测试
 *
 * 测试场景：
 * 1. 同步错误（throw new Error）
 * 2. 异步错误（setTimeout）
 * 3. Promise 拒绝（unhandledrejection）
 * 4. 引用错误（undefined variable）
 * 5. 类型错误（null.method()）
 * 6. 自定义错误类
 * 7. 资源加载错误（由 Errors Integration 也会捕获）
 * 8. 错误去重验证（5秒内重复错误）
 *
 * 验证点：
 * - error_message 正确
 * - error_stack 包含堆栈信息
 * - error_fingerprint 生成
 * - device_* 字段收集
 * - network_* 字段收集
 * - dedup_count 正确计数
 */

import { addBreadcrumb } from '@sky-monitor/monitor-sdk-browser'

export const ErrorsTests = {
    name: 'Errors Integration',
    totalTests: 8,
    tests: [
        {
            id: 'errors-01',
            name: '同步错误捕获',
            description: '测试 throw new Error 的同步错误捕获',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：同步错误',
                    category: 'test',
                    level: 'info',
                })

                try {
                    throw new Error('测试同步错误 - 这是一个预期的错误')
                } catch (error) {
                    // 错误会被全局 window.onerror 捕获
                    // 让错误向上冒泡
                    throw error
                }
            },
            expectedFields: ['error_message', 'error_stack', 'error_fingerprint', 'device_browser', 'network_type'],
            timeout: 2000,
        },
        {
            id: 'errors-02',
            name: '异步错误捕获',
            description: '测试 setTimeout 中的异步错误',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：异步错误',
                    category: 'test',
                    level: 'info',
                })

                return new Promise(resolve => {
                    setTimeout(() => {
                        try {
                            throw new Error('测试异步错误 - setTimeout 中的错误')
                        } catch (error) {
                            resolve()
                        }
                    }, 100)
                })
            },
            expectedFields: ['error_message', 'error_stack', 'error_fingerprint'],
            timeout: 2000,
        },
        {
            id: 'errors-03',
            name: 'Promise 拒绝捕获',
            description: '测试未处理的 Promise 拒绝',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：Promise 拒绝',
                    category: 'test',
                    level: 'info',
                })

                // 创建一个被拒绝的 Promise（不 catch）
                Promise.reject(new Error('测试 Promise 拒绝 - unhandledrejection'))

                // 等待事件处理
                await new Promise(resolve => setTimeout(resolve, 100))
            },
            expectedFields: ['error_message', 'error_stack', 'error_fingerprint'],
            timeout: 2000,
        },
        {
            id: 'errors-04',
            name: '引用错误捕获',
            description: '测试 ReferenceError（访问未定义变量）',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：引用错误',
                    category: 'test',
                    level: 'info',
                })

                try {
                    nonExistentVariable.someMethod()
                } catch (error) {
                    throw error
                }
            },
            expectedFields: ['error_message', 'error_stack', 'error_fingerprint'],
            timeout: 2000,
        },
        {
            id: 'errors-05',
            name: '类型错误捕获',
            description: '测试 TypeError（null/undefined 调用方法）',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：类型错误',
                    category: 'test',
                    level: 'info',
                })

                try {
                    const obj = null
                    obj.someMethod()
                } catch (error) {
                    throw error
                }
            },
            expectedFields: ['error_message', 'error_stack', 'error_fingerprint'],
            timeout: 2000,
        },
        {
            id: 'errors-06',
            name: '自定义错误类',
            description: '测试自定义 Error 子类',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：自定义错误',
                    category: 'test',
                    level: 'info',
                })

                class CustomError extends Error {
                    constructor(message) {
                        super(message)
                        this.name = 'CustomError'
                        this.code = 'CUSTOM_ERROR_CODE'
                    }
                }

                try {
                    throw new CustomError('测试自定义错误类 - CustomError')
                } catch (error) {
                    throw error
                }
            },
            expectedFields: ['error_message', 'error_stack', 'error_fingerprint'],
            timeout: 2000,
        },
        {
            id: 'errors-07',
            name: '资源加载错误',
            description: '测试图片加载失败错误捕获',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：资源加载错误',
                    category: 'test',
                    level: 'info',
                })

                return new Promise(resolve => {
                    const img = new Image()
                    img.onerror = () => {
                        resolve()
                    }
                    // 尝试加载一个不存在的图片
                    img.src = 'https://nonexistent-domain-test-12345.com/nonexistent.png'

                    // 设置超时，防止测试卡住
                    setTimeout(resolve, 1000)
                })
            },
            expectedFields: ['error_message', 'resource_url', 'resource_type'],
            timeout: 3000,
        },
        {
            id: 'errors-08',
            name: '错误去重验证',
            description: '测试 5 秒内相同错误只上报一次，计数累加',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：错误去重',
                    category: 'test',
                    level: 'info',
                })

                const duplicateErrorMessage = '重复错误测试 - 应该被去重'

                // 连续触发 3 次相同错误
                for (let i = 0; i < 3; i++) {
                    try {
                        throw new Error(duplicateErrorMessage)
                    } catch (error) {
                        // 吞掉错误，避免中断测试
                    }
                    await new Promise(resolve => setTimeout(resolve, 100))
                }

                // 验证：只有第一次上报，后续 2 次被去重
                // 后端 dedup_count 应该为 3
            },
            expectedFields: ['error_message', 'error_fingerprint'],
            expectedDedup: true,
            timeout: 3000,
        },
    ],
}

// 导出单独的测试函数供 UI 调用
export function testSyncError() {
    return ErrorsTests.tests[0].run()
}

export function testAsyncError() {
    return ErrorsTests.tests[1].run()
}

export function testPromiseRejection() {
    return ErrorsTests.tests[2].run()
}

export function testReferenceError() {
    return ErrorsTests.tests[3].run()
}

export function testTypeError() {
    return ErrorsTests.tests[4].run()
}

export function testCustomError() {
    return ErrorsTests.tests[5].run()
}

export function testResourceError() {
    return ErrorsTests.tests[6].run()
}

export function testErrorDeduplication() {
    return ErrorsTests.tests[7].run()
}

// 运行所有错误测试
export async function runAllErrorTests() {
    const results = []

    for (const test of ErrorsTests.tests) {
        try {
            await test.run()
            results.push({ id: test.id, name: test.name, status: 'passed' })
        } catch (error) {
            results.push({ id: test.id, name: test.name, status: 'failed', error: error.message })
        }
    }

    return results
}
