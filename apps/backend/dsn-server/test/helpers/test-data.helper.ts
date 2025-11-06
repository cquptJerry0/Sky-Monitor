import { ClickHouseClient, createClient } from '@clickhouse/client'
import axios from 'axios'

/**
 * DSN Server 测试数据辅助工具
 *
 * 提供：
 * 1. 测试用户管理（通过 Monitor Server）
 * 2. 测试应用管理（通过 Monitor Server）
 * 3. 测试事件数据生成
 * 4. 数据清理工具
 */
export class TestDataHelper {
    private clickhouseClient: ClickHouseClient
    private monitorApiBaseUrl: string
    private dsnApiBaseUrl: string
    private authToken?: string
    private createdUserIds: number[] = []
    private createdAppIds: string[] = []

    constructor(
        clickhouseClient?: ClickHouseClient,
        monitorApiBaseUrl = 'http://localhost:8081/api',
        dsnApiBaseUrl = 'http://localhost:8080/api'
    ) {
        this.clickhouseClient =
            clickhouseClient ||
            createClient({
                url: 'http://localhost:8123',
                username: 'default',
                password: 'skyClickhouse2024',
            })
        this.monitorApiBaseUrl = monitorApiBaseUrl
        this.dsnApiBaseUrl = dsnApiBaseUrl
    }

    /**
     * 设置认证 token
     */
    setAuthToken(token: string) {
        this.authToken = token
    }

    /**
     * 登录并获取 token（通过 Monitor Server）
     */
    async login(username = 'admin', password = 'admin123'): Promise<string> {
        try {
            const response = await axios.post(`${this.monitorApiBaseUrl}/auth/login`, {
                username,
                password,
            })
            this.authToken = response.data.data?.access_token || response.data.access_token
            if (!this.authToken) {
                throw new Error('No access_token in response')
            }
            return this.authToken
        } catch (error) {
            throw new Error(`Login failed: ${error.message}`)
        }
    }

    /**
     * 创建测试用户（通过 Monitor Server）
     */
    async createTestUser(username: string, password: string): Promise<{ userId: number; token: string }> {
        try {
            // 1. 注册用户
            const registerResponse = await axios.post(`${this.monitorApiBaseUrl}/admin/register`, {
                username,
                password,
                email: `${username}@test.com`,
                role: 'user',
            })

            const userId = registerResponse.data.data.id
            this.createdUserIds.push(userId)

            // 2. 登录获取 token
            const token = await this.login(username, password)

            return { userId, token }
        } catch (error) {
            throw new Error(`Failed to create test user: ${error.message}`)
        }
    }

    /**
     * 删除测试用户（标记清理）
     */
    async deleteTestUser(userId: number): Promise<void> {
        try {
            console.log(`Test user ${userId} marked for cleanup (no delete API available)`)
            this.createdUserIds = this.createdUserIds.filter(id => id !== userId)
        } catch (error) {
            console.warn(`Failed to delete test user ${userId}:`, error.message)
        }
    }

    /**
     * 创建测试应用（通过 Monitor Server）
     */
    async createTestApp(appName?: string): Promise<string> {
        try {
            const response = await axios.post(
                `${this.monitorApiBaseUrl}/application`,
                {
                    name: appName || `DSN Test App ${Date.now()}`,
                    type: 'vanilla',
                    description: 'Auto-created test application for DSN Server',
                },
                {
                    headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
                }
            )
            // 后端自动生成 appId (type + nanoid(6))
            const appId = response.data.data.appId
            if (!appId) {
                throw new Error('No appId in response')
            }
            this.createdAppIds.push(appId)
            return appId
        } catch (error) {
            throw new Error(`Failed to create test app: ${error.message}`)
        }
    }

    /**
     * 删除测试应用（通过 Monitor Server）
     */
    async deleteTestApp(appId: string): Promise<void> {
        try {
            await axios.delete(`${this.monitorApiBaseUrl}/application`, {
                data: { appId },
                headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
            })
            this.createdAppIds = this.createdAppIds.filter(id => id !== appId)
        } catch (error) {
            console.warn(`Failed to delete test app ${appId}:`, error.message)
        }
    }

    /**
     * 清理测试数据
     */
    async cleanupTestData(appId?: string): Promise<void> {
        try {
            const condition = appId ? `app_id = '${appId}'` : `app_id LIKE '%test%' OR error_message LIKE '%test%'`

            await this.clickhouseClient.command({
                query: `ALTER TABLE monitor_events DELETE WHERE ${condition}`,
            })
        } catch (error) {
            console.warn(`Failed to cleanup test data:`, error.message)
        }
    }

    /**
     * 等待数据同步
     */
    async waitForDataSync(ms = 1000): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, ms))
    }

    // ========================================
    // 测试事件生成器
    // ========================================

    /**
     * 创建完整的测试事件（包含所有新字段）
     */
    static createCompleteEvent(overrides?: Partial<any>) {
        const baseTime = Date.now()
        const sessionId = `session-${baseTime}`
        const userId = `user-${baseTime}`

        return {
            type: 'error',
            name: 'TestError',
            message: 'Complete test error with all SDK features',
            stack: 'Error: Test\n  at test.js:1:1',
            path: '/test-page',
            userAgent: 'TestAgent/1.0',

            // Session 字段
            sessionId,
            _session: {
                startTime: baseTime,
                duration: 5000,
                eventCount: 10,
                errorCount: 2,
                pageViews: 3,
            },

            // User 字段
            user: {
                id: userId,
                email: 'test@example.com',
                username: 'testuser',
                ip_address: '127.0.0.1',
            },

            // Scope 字段
            tags: {
                env: 'test',
                version: '1.0.0',
                feature: 'sdk-test',
            },
            extra: {
                customData: 'test-value',
                debugInfo: { test: true },
            },
            breadcrumbs: [
                {
                    message: 'User clicked button',
                    level: 'info',
                    category: 'ui',
                    timestamp: baseTime - 2000,
                    data: { buttonId: 'submit-btn' },
                },
            ],
            contexts: {
                app: { name: 'TestApp', version: '1.0' },
            },

            // Event Level
            level: 'error',
            environment: 'test',

            // Error 字段
            lineno: 10,
            colno: 5,
            errorFingerprint: {
                hash: 'test-fingerprint-hash',
                algorithm: 'stacktrace',
            },

            // Device 字段
            device: {
                browser: 'Chrome',
                browserVersion: '120.0',
                os: 'macOS',
                osVersion: '14.0',
                deviceType: 'desktop',
                screenResolution: '1920x1080',
                language: 'zh-CN',
                timezone: 'Asia/Shanghai',
            },

            // Network 字段
            network: {
                effectiveType: '4g',
                downlink: 10,
                rtt: 50,
                saveData: false,
            },

            // Deduplication 元数据
            _deduplication: {
                fingerprint: 'test-fingerprint-hash',
                count: 5,
            },

            // Sampling 元数据
            _sampling: {
                rate: 1.0,
                sampled: true,
                timestamp: baseTime,
            },

            // Release
            release: '1.0.0-test',

            ...overrides,
        }
    }

    /**
     * 创建 Performance 测试事件
     */
    static createPerformanceEvent(overrides?: Partial<any>) {
        const baseTime = Date.now()

        return {
            type: 'performance',
            name: 'http',
            category: 'http',
            url: '/api/test-endpoint',
            method: 'GET',
            status: 200,
            duration: 3500,
            isSlow: true,
            success: true,

            sessionId: `session-${baseTime}`,
            _session: {
                startTime: baseTime,
                duration: 1000,
                eventCount: 1,
                errorCount: 0,
                pageViews: 1,
            },

            user: {
                id: `user-${baseTime}`,
                email: 'perf-test@example.com',
            },

            _sampling: {
                rate: 0.3,
                sampled: true,
                timestamp: baseTime,
            },

            ...overrides,
        }
    }

    /**
     * 创建 Web Vitals 测试事件
     */
    static createWebVitalEvent(metric: 'LCP' | 'FCP' | 'CLS' | 'TTFB', value: number) {
        const baseTime = Date.now()

        return {
            type: 'webVital',
            name: metric,
            value,
            path: '/test-page',
            category: 'webvital',

            sessionId: `session-${baseTime}`,
            user: {
                id: `user-${baseTime}`,
            },
            _sampling: {
                rate: 0.3,
                sampled: true,
                timestamp: baseTime,
            },
        }
    }

    /**
     * 创建 Vue 错误事件
     */
    static createVueErrorEvent() {
        return {
            ...this.createCompleteEvent(),
            framework: 'vue',
            vueError: {
                componentName: 'TestComponent',
                componentHierarchy: ['App', 'Layout', 'TestComponent'],
                lifecycle: 'mounted',
                props: { id: 1, name: 'test' },
            },
        }
    }

    /**
     * 创建 React 错误事件
     */
    static createReactErrorEvent() {
        return {
            ...this.createCompleteEvent(),
            framework: 'react',
            reactError: {
                componentName: 'TestComponent',
                componentStack: 'at TestComponent\n  at App',
                errorBoundary: 'ErrorBoundary',
            },
        }
    }

    /**
     * 创建 HTTP 错误事件
     */
    static createHttpErrorEvent() {
        return {
            ...this.createCompleteEvent(),
            httpError: {
                url: '/api/test',
                method: 'POST',
                status: 500,
                statusText: 'Internal Server Error',
                duration: 1200,
                requestHeaders: { 'Content-Type': 'application/json' },
                responseHeaders: { 'Content-Type': 'application/json' },
            },
        }
    }

    /**
     * 创建资源错误事件
     */
    static createResourceErrorEvent() {
        return {
            ...this.createCompleteEvent(),
            resourceError: {
                url: '/assets/image.png',
                tagName: 'img',
                resourceType: 'img',
                outerHTML: '<img src="/assets/image.png" />',
            },
        }
    }

    /**
     * 创建批量测试事件
     */
    static createBatchEvents(count = 5) {
        return Array.from({ length: count }, (_, i) => ({
            ...this.createCompleteEvent({
                name: `BatchError${i}`,
                message: `Batch test event ${i}`,
            }),
        }))
    }
}
