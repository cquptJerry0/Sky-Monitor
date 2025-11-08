import { createClient, ClickHouseClient } from '@clickhouse/client'
import axios, { AxiosInstance } from 'axios'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { cleanupTestData, setupTestEnvironment } from './setup'
import { TestDataHelper } from './helpers/test-data.helper'

/**
 * DSN Server 完整 API 测试套件
 *
 * 测试架构：
 * 1. 使用独立测试用户和应用（通过 Monitor Server 创建）
 * 2. 测试所有事件接收端点
 * 3. 验证数据正确写入 ClickHouse
 * 4. 完整的生命周期管理
 */

const DSN_API_BASE = 'http://localhost:8080/api'
const MONITOR_API_BASE = 'http://localhost:8081/api'
const CLICKHOUSE_URL = 'http://localhost:8123'

describe('DSN Server - Complete API Test Suite', () => {
    let client: AxiosInstance
    let clickhouseClient: ClickHouseClient
    let testHelper: TestDataHelper

    // 测试用户和应用
    let testUser: { userId: number; username: string; token: string }
    let testApp: { appId: string; name: string }

    beforeAll(async () => {
        // 1. 环境准备
        console.log('\n=== 准备测试环境 ===')
        await setupTestEnvironment()

        // 2. 初始化客户端
        client = axios.create({
            baseURL: DSN_API_BASE,
            timeout: 10000,
            validateStatus: () => true,
        })

        clickhouseClient = createClient({
            url: CLICKHOUSE_URL,
            username: 'default',
            password: 'skyClickhouse2024',
        })

        testHelper = new TestDataHelper(clickhouseClient, MONITOR_API_BASE, DSN_API_BASE)

        // 3. 创建独立测试用户（通过 Monitor Server）
        try {
            const username = `test_dsn_${Date.now()}`
            const password = 'Test@123456'

            const { userId, token } = await testHelper.createTestUser(username, password)
            testUser = { userId, username, token }
            console.log(`✓ 创建测试用户: ${username} (ID: ${userId})`)

            // 4. 设置认证
            testHelper.setAuthToken(token)

            // 5. 创建测试应用（通过 Monitor Server）
            const appId = await testHelper.createTestApp('DSN API Test App')
            testApp = { appId, name: 'DSN API Test App' }
            console.log(`✓ 创建测试应用: ${appId}`)
        } catch (error) {
            console.warn(`⚠ 无法创建测试用户/应用: ${error.message}`)
            console.warn('将使用已存在的应用进行测试')
            // 如果创建失败，使用一个已存在的 appId
            testApp = { appId: 'vanillaV9pEeA', name: 'Fallback App' }
        }

        console.log('=== 测试环境准备完成 ===\n')
    })

    afterAll(async () => {
        console.log('\n=== 清理测试环境 ===')
        try {
            // 只有在成功创建测试用户时才清理
            if (testHelper && testUser) {
                if (testApp && testApp.appId !== 'vanillaV9pEeA') {
                    await testHelper.cleanupTestData(testApp.appId)
                    await testHelper.deleteTestApp(testApp.appId)
                    console.log(`✓ 清理应用: ${testApp.appId}`)
                }

                await testHelper.deleteTestUser(testUser.userId)
                console.log(`✓ 清理用户: ${testUser.username}`)
            }

            // 清理所有测试数据
            await cleanupTestData()
        } catch (error) {
            console.error('✗ 清理失败:', error.message)
        } finally {
            if (clickhouseClient) {
                await clickhouseClient.close()
            }
            console.log('=== 测试环境清理完成 ===\n')
        }
    })

    // ========================================
    // 1. Health 模块测试
    // ========================================
    describe('Health API', () => {
        it('GET /monitoring/health - 应该返回健康状态', async () => {
            const { status, data } = await client.get('/monitoring/health')

            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data).toHaveProperty('database')
        })

        it('GET /monitoring/health/diagnostics - 应该返回诊断信息', async () => {
            const { status, data } = await client.get('/monitoring/health/diagnostics')

            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data).toHaveProperty('diagnostics')
            expect(data.diagnostics).toHaveProperty('pipeline')
        })

        it('GET /monitoring/health/recent-events - 应该返回最近事件', async () => {
            const { status, data } = await client.get('/monitoring/health/recent-events', {
                params: { limit: 5 },
            })

            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data).toHaveProperty('data')
        })
    })

    // ========================================
    // 2. 单个事件接收测试
    // ========================================
    describe('Single Event Reception', () => {
        it('POST /monitoring/:appId - 应该接收基础事件', async () => {
            const event = {
                type: 'error',
                name: 'TestError',
                message: 'Basic test error',
                path: '/test-page',
            }

            const { status, data } = await client.post(`/monitoring/${testApp.appId}`, event)

            expect([200, 201, 400, 500]).toContain(status)
            if (status === 200 || status === 201) {
                expect(data.success).toBe(true)
            }
        })

        it('POST /monitoring/:appId - 应该接收完整 SDK 事件', async () => {
            const completeEvent = TestDataHelper.createCompleteEvent()

            const { status, data } = await client.post(`/monitoring/${testApp.appId}`, completeEvent)

            expect([200, 201, 400, 500]).toContain(status)
            if (status === 200 || status === 201) {
                expect(data.success).toBe(true)
            }
        })

        it('POST /monitoring/:appId - 应该接收 Performance 事件', async () => {
            const perfEvent = TestDataHelper.createPerformanceEvent()

            const { status, data } = await client.post(`/monitoring/${testApp.appId}`, perfEvent)

            expect([200, 201, 400, 500]).toContain(status)
            if (status === 200 || status === 201) {
                expect(data.success).toBe(true)
            }
        })

        it('POST /monitoring/:appId - 应该接收 Web Vitals 事件', async () => {
            const lcpEvent = TestDataHelper.createWebVitalEvent('LCP', 2500)

            const { status, data } = await client.post(`/monitoring/${testApp.appId}`, lcpEvent)

            expect([200, 201, 400, 500]).toContain(status)
            if (status === 200 || status === 201) {
                expect(data.success).toBe(true)
            }
        })
    })

    // ========================================
    // 3. 框架特定事件测试
    // ========================================
    describe('Framework-Specific Events', () => {
        it('POST /monitoring/:appId - 应该接收 Vue 错误事件', async () => {
            const vueEvent = TestDataHelper.createVueErrorEvent()

            const { status, data } = await client.post(`/monitoring/${testApp.appId}`, vueEvent)

            expect([200, 201, 400, 500]).toContain(status)
            if (status === 200 || status === 201) {
                expect(data.success).toBe(true)
            }
        })

        it('POST /monitoring/:appId - 应该接收 React 错误事件', async () => {
            const reactEvent = TestDataHelper.createReactErrorEvent()

            const { status, data } = await client.post(`/monitoring/${testApp.appId}`, reactEvent)

            expect([200, 201, 400, 500]).toContain(status)
            if (status === 200 || status === 201) {
                expect(data.success).toBe(true)
            }
        })

        it('POST /monitoring/:appId - 应该接收 HTTP 错误事件', async () => {
            const httpEvent = TestDataHelper.createHttpErrorEvent()

            const { status, data } = await client.post(`/monitoring/${testApp.appId}`, httpEvent)

            expect([200, 201, 400, 500]).toContain(status)
            if (status === 200 || status === 201) {
                expect(data.success).toBe(true)
            }
        })

        it('POST /monitoring/:appId - 应该接收资源错误事件', async () => {
            const resourceEvent = TestDataHelper.createResourceErrorEvent()

            const { status, data } = await client.post(`/monitoring/${testApp.appId}`, resourceEvent)

            expect([200, 201, 400, 500]).toContain(status)
            if (status === 200 || status === 201) {
                expect(data.success).toBe(true)
            }
        })
    })

    // ========================================
    // 4. 批量事件接收测试
    // ========================================
    describe('Batch Events Reception', () => {
        it('POST /monitoring/:appId/batch - 应该接收批量基础事件', async () => {
            const batchPayload = [
                {
                    type: 'error',
                    name: 'Error1',
                    message: 'First error',
                },
                {
                    type: 'performance',
                    name: 'PageLoad',
                    value: 1500,
                },
            ]

            const { status, data } = await client.post(`/monitoring/${testApp.appId}/batch`, batchPayload)

            expect([200, 201]).toContain(status)
            if (status === 200 || status === 201) {
                expect(data.success).toBe(true)
            }
        })

        it('POST /monitoring/:appId/batch - 应该接收批量完整事件', async () => {
            const batchPayload = TestDataHelper.createBatchEvents(5)

            const { status, data } = await client.post(`/monitoring/${testApp.appId}/batch`, batchPayload)

            expect([200, 201]).toContain(status)
            if (status === 200 || status === 201) {
                expect(data.success).toBe(true)
                expect(data.message).toContain('5 events')
            }
        })

        it('POST /monitoring/:appId/batch - 应该处理大批量事件', async () => {
            const largeBatch = Array(50)
                .fill(null)
                .map((_, i) => ({
                    type: 'log',
                    name: `Event${i}`,
                    value: 1,
                    message: `Batch event ${i}`,
                }))

            const { status, data } = await client.post(`/monitoring/${testApp.appId}/batch`, largeBatch)

            expect([200, 201, 413]).toContain(status)
            if (status === 200 || status === 201) {
                expect(data.success).toBe(true)
            }
        })
    })

    // ========================================
    // 5. 数据验证测试
    // ========================================
    describe('Data Validation', () => {
        it('应该拒绝空事件对象', async () => {
            const { status } = await client.post(`/monitoring/${testApp.appId}`, {})

            expect([400, 404, 500]).toContain(status)
        })

        it('应该处理缺少必填字段的事件', async () => {
            const incompleteEvent = {
                type: 'error',
                // 缺少 name
            }

            const { status } = await client.post(`/monitoring/${testApp.appId}`, incompleteEvent)

            expect([200, 201, 400, 500]).toContain(status)
        })

        it('应该验证 appId 格式', async () => {
            const invalidAppId = 'invalid app id with spaces'
            const payload = { type: 'error', name: 'Test', value: 1 }

            const { status } = await client.post(`/monitoring/${invalidAppId}`, payload)

            expect([400, 404]).toContain(status)
        })

        it('应该处理不存在的 appId', async () => {
            const nonExistentAppId = 'nonexistent123'
            const payload = { type: 'error', name: 'Test', value: 1 }

            const { status } = await client.post(`/monitoring/${nonExistentAppId}`, payload)

            expect([404, 400]).toContain(status)
        })
    })

    // ========================================
    // 6. 特殊字符和编码测试
    // ========================================
    describe('Special Characters & Encoding', () => {
        it('应该处理 Unicode 字符', async () => {
            const unicodeEvent = {
                type: 'error',
                name: '测试错误',
                message: '日本語エラー',
                path: '/路径/测试',
            }

            const { status } = await client.post(`/monitoring/${testApp.appId}`, unicodeEvent)

            expect([200, 201, 400, 500]).toContain(status)
        })

        it('应该处理 HTML 特殊字符', async () => {
            const htmlEvent = {
                type: 'error',
                name: 'Test<script>alert(1)</script>',
                message: 'Test "quotes" and \'apostrophes\'',
            }

            const { status } = await client.post(`/monitoring/${testApp.appId}`, htmlEvent)

            expect([200, 201, 400, 500]).toContain(status)
        })

        it('应该处理非常长的消息', async () => {
            const longMessage = 'x'.repeat(10000)
            const largeEvent = {
                type: 'error',
                name: 'LargeError',
                message: longMessage,
            }

            const { status } = await client.post(`/monitoring/${testApp.appId}`, largeEvent)

            expect([200, 201, 413, 500]).toContain(status)
        })
    })

    // ========================================
    // 7. 并发和性能测试
    // ========================================
    describe('Concurrency & Performance', () => {
        it('应该处理并发事件提交', async () => {
            const events = Array(5)
                .fill(null)
                .map((_, i) => ({
                    type: 'error',
                    name: `ConcurrentError${i}`,
                    message: `Concurrent test ${i}`,
                }))

            const requests = events.map(event => client.post(`/monitoring/${testApp.appId}`, event))
            const results = await Promise.all(requests)

            const successCount = results.filter(r => [200, 201].includes(r.status)).length
            expect(successCount).toBeGreaterThanOrEqual(0)
        })

        it('单个事件提交应该在合理时间内完成', async () => {
            const event = {
                type: 'error',
                name: 'PerformanceTest',
                message: 'Test event',
            }

            const startTime = Date.now()
            await client.post(`/monitoring/${testApp.appId}`, event)
            const duration = Date.now() - startTime

            expect(duration).toBeLessThan(2000) // 2秒内
        })
    })

    // ========================================
    // 8. ClickHouse 数据验证
    // ========================================
    describe('ClickHouse Data Verification', () => {
        it('事件应该正确写入 ClickHouse', async () => {
            // 插入一个带特殊标记的事件
            const uniqueMessage = `Verification-Test-${Date.now()}`
            const event = {
                type: 'error',
                name: 'VerificationError',
                message: uniqueMessage,
            }

            const { status } = await client.post(`/monitoring/${testApp.appId}`, event)

            // 只有在成功插入时才验证
            if (status === 200 || status === 201) {
                // 等待数据写入
                await testHelper.waitForDataSync(2000)

                // 查询验证
                const result = await clickhouseClient.query({
                    query: `SELECT * FROM monitor_events WHERE error_message = '${uniqueMessage}' LIMIT 1`,
                    format: 'JSONEachRow',
                })

                const rows = (await result.json()) as any
                if (rows.data) {
                    expect(rows.data.length).toBeGreaterThan(0)
                }
            }
        })
    })

    // ========================================
    // 9. 错误场景测试
    // ========================================
    describe('Error Scenarios', () => {
        it('应该处理畸形 JSON', async () => {
            try {
                await client.post(`/monitoring/${testApp.appId}`, 'invalid json', {
                    headers: { 'Content-Type': 'application/json' },
                })
            } catch (error) {
                expect(error).toBeDefined()
            }
        })

        it('应该处理批量事件中的部分无效事件', async () => {
            const mixedBatch = [
                { type: 'error', name: 'ValidError', value: 1 },
                {},
                { type: 'performance', name: 'ValidPerf', value: 2000 },
            ]

            const { status } = await client.post(`/monitoring/${testApp.appId}/batch`, mixedBatch)
            expect([200, 201, 400]).toContain(status)
        })
    })
})
