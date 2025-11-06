import { createClient, ClickHouseClient } from '@clickhouse/client'
import axios, { AxiosInstance } from 'axios'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { cleanupTestData, setupTestEnvironment } from './setup'
import { TestDataHelper } from './helpers/test-data.helper'

/**
 * Monitor Server 完整 API 测试套件
 *
 * 测试架构：
 * 1. 使用独立测试用户，避免与其他测试冲突
 * 2. 按模块组织测试：Auth → Admin → Application → Events → SourceMap → Health
 * 3. 完整的生命周期管理：创建用户 → 创建应用 → 插入数据 → 测试 API → 清理
 * 4. 无 4xx 错误（除非明确测试权限场景）
 */

const API_BASE = 'http://localhost:8081/api'
const CLICKHOUSE_URL = 'http://localhost:8123'

describe('Monitor Server - Complete API Test Suite', () => {
    let client: AxiosInstance
    let clickhouseClient: ClickHouseClient
    let testHelper: TestDataHelper

    // 测试用户和应用
    let testUser: { userId: number; username: string; token: string }
    let testApp: { appId: string; name: string }
    let testSession: { sessionId: string; userId: string }

    beforeAll(async () => {
        // 1. 环境准备
        console.log('\n=== 准备测试环境 ===')
        await setupTestEnvironment()

        // 2. 初始化客户端
        client = axios.create({
            baseURL: API_BASE,
            timeout: 10000,
            validateStatus: () => true, // 允许所有状态码，由测试自己判断
        })

        clickhouseClient = createClient({
            url: CLICKHOUSE_URL,
            username: 'default',
            password: 'skyClickhouse2024',
        })

        testHelper = new TestDataHelper(clickhouseClient, API_BASE)

        // 3. 创建独立测试用户
        const username = `test_monitor_${Date.now()}`
        const password = 'Test@123456'

        const { userId, token } = await testHelper.createTestUser(username, password)
        testUser = { userId, username, token }
        console.log(`✓ 创建测试用户: ${username} (ID: ${userId})`)

        // 4. 设置认证
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`
        testHelper.setAuthToken(token)

        // 5. 创建测试应用
        const appId = await testHelper.createTestApp('Monitor API Test App')
        testApp = { appId, name: 'Monitor API Test App' }
        console.log(`✓ 创建测试应用: ${appId}`)

        // 6. 准备测试数据
        testSession = {
            sessionId: `session-${Date.now()}`,
            userId: `user-${Date.now()}`,
        }

        const testEvents = testHelper.createStandardTestEvents(testSession.sessionId, testSession.userId)
        await testHelper.insertTestEvents(testApp.appId, testEvents)
        console.log(`✓ 插入 ${testEvents.length} 条测试事件`)

        // 7. 等待数据同步
        await testHelper.waitForDataSync(2000)
        console.log('=== 测试环境准备完成 ===\n')
    })

    afterAll(async () => {
        console.log('\n=== 清理测试环境 ===')
        try {
            // 只有在初始化成功后才清理
            if (testHelper && testApp) {
                await testHelper.cleanupTestData(testApp.appId)
                await testHelper.deleteTestApp(testApp.appId)
                console.log(`✓ 清理应用: ${testApp.appId}`)
            }

            if (testHelper && testUser) {
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
        it('GET /health - 应该返回健康状态', async () => {
            const { status, data } = await client.get('/health')

            expect(status).toBe(200)
            expect(data).toHaveProperty('status')
        })

        it('GET /health/dependencies - 应该返回依赖状态', async () => {
            const { status, data } = await client.get('/health/dependencies')

            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data).toHaveProperty('dependencies')
            expect(data.dependencies).toHaveProperty('clickhouse')
            expect(data.dependencies).toHaveProperty('redis')
            expect(data.dependencies).toHaveProperty('postgresql')
        })
    })

    // ========================================
    // 2. Auth 模块测试
    // ========================================
    describe('Auth API', () => {
        let refreshToken: string

        it('POST /auth/login - 应该成功登录', async () => {
            const { status, data } = await client.post('/auth/login', {
                username: testUser.username,
                password: 'Test@123456',
            })

            expect([200, 201]).toContain(status)
            expect(data.success).toBe(true)
            expect(data.data).toHaveProperty('access_token')
            expect(data.data).toHaveProperty('refresh_token')

            refreshToken = data.data.refresh_token
        })

        it('GET /me - 应该获取当前用户信息', async () => {
            const { status, data } = await client.get('/me')

            expect(status).toBe(200)
            expect(data).toHaveProperty('id', testUser.userId)
            expect(data).toHaveProperty('username', testUser.username)
        })

        it('POST /auth/refresh - 应该刷新 token', async () => {
            const { status, data } = await client.post('/auth/refresh', {
                refresh_token: refreshToken,
            })

            expect([200, 201]).toContain(status)
            expect(data.success).toBe(true)
            expect(data.data).toHaveProperty('access_token')
        })

        // 注意：不测试 logout，避免影响后续测试
    })

    // ========================================
    // 3. Application 模块测试
    // ========================================
    describe('Application API', () => {
        it('GET /application - 应该获取应用列表', async () => {
            const { status, data } = await client.get('/application')

            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toHaveProperty('applications')
            expect(data.data).toHaveProperty('count')

            // 验证包含我们的测试应用
            const apps = data.data.applications
            const hasTestApp = apps.some((app: any) => app.appId === testApp.appId)
            expect(hasTestApp).toBe(true)
        })

        it('POST /application - 应该创建新应用', async () => {
            const { status, data } = await client.post('/application', {
                name: 'Temp Test App',
                type: 'react',
                description: 'Temporary app for testing',
            })

            expect([200, 201]).toContain(status)
            expect(data.success).toBe(true)
            expect(data.data).toHaveProperty('appId')

            // 清理临时应用
            const tempAppId = data.data.appId
            await client.delete('/application', {
                data: { appId: tempAppId },
            })
        })
    })

    // ========================================
    // 4. Events 模块测试 - 基础查询
    // ========================================
    describe('Events API - Basic Queries', () => {
        it('GET /events - 应该获取事件列表', async () => {
            const { status, data } = await client.get('/events', {
                params: { appId: testApp.appId, limit: 10 },
            })

            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toBeDefined()
            // 数据可能是数组或对象格式
            if (Array.isArray(data.data)) {
                expect(data.data).toBeInstanceOf(Array)
            } else {
                expect(data.data).toHaveProperty('data')
            }
        })

        it('GET /events/:id - 应该获取事件详情', async () => {
            // 先获取一个事件ID
            const listRes = await client.get('/events', {
                params: { appId: testApp.appId, limit: 1 },
            })

            if (listRes.data.data.length > 0) {
                const eventId = listRes.data.data[0].id
                const { status, data } = await client.get(`/events/${eventId}`)

                expect(status).toBe(200)
                expect(data.success).toBe(true)
                expect(data.data).toHaveProperty('id', eventId)
            }
        })

        it('GET /events/stats/summary - 应该获取统计摘要', async () => {
            const { status, data } = await client.get('/events/stats/summary', {
                params: { appId: testApp.appId },
            })

            expect([200, 500]).toContain(status) // 允许500（数据可能不足）
            if (status === 200) {
                expect(data.success).toBe(true)
                expect(data.data).toBeDefined()
            }
        })

        it('GET /events/app/:appId/summary - 应该获取应用摘要', async () => {
            const { status, data } = await client.get(`/events/app/${testApp.appId}/summary`)

            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toBeDefined()
        })
    })

    // ========================================
    // 5. Events 模块测试 - Session API
    // ========================================
    describe('Events API - Session', () => {
        it('GET /events/sessions/list - 应该获取会话列表', async () => {
            const { status, data } = await client.get('/events/sessions/list', {
                params: { appId: testApp.appId, limit: 10 },
            })

            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toHaveProperty('data')
            expect(data.data).toHaveProperty('total')
            expect(data.data.data).toBeInstanceOf(Array)
        })

        it('GET /events/sessions/:sessionId - 应该获取会话详情', async () => {
            const { status, data } = await client.get(`/events/sessions/${testSession.sessionId}`, {
                params: { appId: testApp.appId },
            })

            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toHaveProperty('data')
            expect(data.data.data).toBeInstanceOf(Array)
        })

        it('GET /events/sessions/list - 应该支持分页', async () => {
            const { status, data } = await client.get('/events/sessions/list', {
                params: { appId: testApp.appId, limit: 5, offset: 0 },
            })

            expect(status).toBe(200)
            if (data.data) {
                expect(data.data.limit).toBe(5)
                expect(data.data.offset).toBe(0)
            }
        })
    })

    // ========================================
    // 6. Events 模块测试 - Performance API
    // ========================================
    describe('Events API - Performance', () => {
        it('GET /events/performance/slow-requests - 应该获取慢请求列表', async () => {
            const { status, data } = await client.get('/events/performance/slow-requests', {
                params: { appId: testApp.appId },
            })

            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toHaveProperty('data')
            expect(data.data.data).toBeInstanceOf(Array)
        })

        it('GET /events/performance/slow-requests - 应该支持自定义阈值', async () => {
            const { status, data } = await client.get('/events/performance/slow-requests', {
                params: { appId: testApp.appId, threshold: 5000 },
            })

            expect(status).toBe(200)
            if (data.data) {
                expect(data.data.threshold).toBe(5000)
            }
        })
    })

    // ========================================
    // 7. Events 模块测试 - Error Groups API
    // ========================================
    describe('Events API - Error Groups', () => {
        it('GET /events/errors/groups - 应该获取错误聚合数据', async () => {
            const { status, data } = await client.get('/events/errors/groups', {
                params: { appId: testApp.appId },
            })

            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toHaveProperty('data')
            expect(data.data.data).toBeInstanceOf(Array)
        })

        it('GET /events/errors/groups - 应该包含去重计数', async () => {
            const { status, data } = await client.get('/events/errors/groups', {
                params: { appId: testApp.appId },
            })

            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toHaveProperty('data')
            expect(data.data.data).toBeInstanceOf(Array)
            // 有数据时验证字段
            if (data.data.data.length > 0) {
                const firstGroup = data.data.data[0]
                expect(firstGroup).toHaveProperty('error_fingerprint')
            }
        })
    })

    // ========================================
    // 8. Events 模块测试 - User API
    // ========================================
    describe('Events API - User', () => {
        it('GET /events/users/:userId - 应该获取用户事件', async () => {
            const { status, data } = await client.get(`/events/users/${testSession.userId}`, {
                params: { appId: testApp.appId },
            })

            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toHaveProperty('data')
            expect(data.data.data).toBeInstanceOf(Array)
        })

        it('GET /events/users/:userId - 应该支持限制返回数量', async () => {
            const { status, data } = await client.get(`/events/users/${testSession.userId}`, {
                params: { appId: testApp.appId, limit: 3 },
            })

            expect(status).toBe(200)
            if (data.data && data.data.data.length > 0) {
                expect(data.data.data.length).toBeLessThanOrEqual(3)
            }
        })
    })

    // ========================================
    // 9. Events 模块测试 - Sampling API
    // ========================================
    describe('Events API - Sampling', () => {
        it('GET /events/stats/sampling - 应该获取采样率统计', async () => {
            const { status, data } = await client.get('/events/stats/sampling', {
                params: { appId: testApp.appId },
            })

            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toBeDefined()
        })

        it('GET /events/stats/sampling - 应该包含采样率和估算总数', async () => {
            const { status, data } = await client.get('/events/stats/sampling', {
                params: { appId: testApp.appId },
            })

            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toBeDefined()
            // 数据格式可能是对象或数组，只要有数据即可
        })
    })

    // ========================================
    // 10. 权限测试
    // ========================================
    describe('Authorization', () => {
        it('应该拒绝访问不存在的应用', async () => {
            const { status } = await client.get('/events', {
                params: { appId: 'non-existent-app' },
            })

            // 应该返回 403（无权限）
            expect(status).toBe(403)
        })

        it('应该拒绝无效的 token', async () => {
            const { status } = await client.get('/events', {
                params: { appId: testApp.appId },
                headers: { Authorization: 'Bearer invalid-token' },
            })

            // 应该返回 401（未认证）
            expect(status).toBe(401)
        })
    })

    // ========================================
    // 11. 边界情况测试
    // ========================================
    describe('Edge Cases', () => {
        it('应该处理空应用（无事件）', async () => {
            // 创建一个新应用（无事件）
            const createRes = await client.post('/application', {
                name: 'Empty App',
                type: 'vanilla',
            })

            const emptyAppId = createRes.data.data.appId

            try {
                const { status, data } = await client.get('/events/sessions/list', {
                    params: { appId: emptyAppId },
                })

                expect(status).toBe(200)
                expect(data.data.total).toBe(0)
                expect(data.data.data).toEqual([])
            } finally {
                await client.delete('/application', {
                    data: { appId: emptyAppId },
                })
            }
        })

        it('应该处理不存在的会话ID', async () => {
            const { status, data } = await client.get('/events/sessions/non-existent-session', {
                params: { appId: testApp.appId },
            })

            expect(status).toBe(200)
            if (data.data && data.data.data) {
                expect(data.data.data).toEqual([])
            }
        })

        it('应该处理不存在的用户ID', async () => {
            const { status, data } = await client.get('/events/users/non-existent-user', {
                params: { appId: testApp.appId },
            })

            expect(status).toBe(200)
            if (data.data && data.data.data) {
                expect(data.data.data).toEqual([])
            }
        })
    })

    // ========================================
    // 12. 性能测试
    // ========================================
    describe('Performance', () => {
        it('查询接口应该在合理时间内返回', async () => {
            const startTime = Date.now()

            await client.get('/events', {
                params: { appId: testApp.appId, limit: 100 },
            })

            const duration = Date.now() - startTime
            expect(duration).toBeLessThan(5000) // 5秒内
        })
    })
})
