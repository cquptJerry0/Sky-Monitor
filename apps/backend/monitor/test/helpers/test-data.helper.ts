import { ClickHouseClient, createClient } from '@clickhouse/client'
import axios from 'axios'

/**
 * 测试数据辅助工具
 * 用于创建测试 appId 和插入测试事件
 */
export class TestDataHelper {
    private clickhouseClient: ClickHouseClient
    private apiBaseUrl: string
    private authToken?: string
    private createdUserIds: number[] = [] // 记录创建的用户 ID，用于清理
    private createdAppIds: string[] = [] // 记录创建的应用 ID，用于清理

    constructor(clickhouseClient?: ClickHouseClient, apiBaseUrl = 'http://localhost:8081/api') {
        this.clickhouseClient =
            clickhouseClient ||
            createClient({
                url: 'http://localhost:8123',
                username: 'default',
                password: 'skyClickhouse2024',
            })
        this.apiBaseUrl = apiBaseUrl
    }

    /**
     * 设置认证 token
     */
    setAuthToken(token: string) {
        this.authToken = token
    }

    /**
     * 登录并获取 token
     */
    async login(username = 'admin', password = 'admin123'): Promise<string> {
        try {
            const response = await axios.post(`${this.apiBaseUrl}/auth/login`, {
                username,
                password,
            })
            // 登录接口返回格式: { data: { access_token: "..." }, success: true }
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
     * 创建测试用户
     */
    async createTestUser(username: string, password: string): Promise<{ userId: number; token: string }> {
        try {
            // 1. 注册用户
            const registerResponse = await axios.post(`${this.apiBaseUrl}/admin/register`, {
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
     * 删除测试用户（通过直接删除数据库记录）
     * 注意：由于没有删除 API，这里只是标记清理，实际清理依赖数据库手动清理或测试环境重置
     */
    async deleteTestUser(userId: number): Promise<void> {
        try {
            console.log(`Test user ${userId} marked for cleanup (no delete API available)`)

            // 从记录中移除
            this.createdUserIds = this.createdUserIds.filter(id => id !== userId)
        } catch (error) {
            console.warn(`Failed to delete test user ${userId}:`, error.message)
        }
    }

    /**
     * 创建测试应用
     */
    async createTestApp(appName?: string): Promise<string> {
        try {
            const response = await axios.post(
                `${this.apiBaseUrl}/application`,
                {
                    name: appName || `Test App ${Date.now()}`,
                    type: 'vanilla',
                    description: 'Auto-created test application',
                },
                {
                    headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
                }
            )
            // 后端自动生成 appId (type + nanoid(6))，从响应中获取
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
     * 插入测试事件到 ClickHouse
     */
    async insertTestEvents(appId: string, events: Array<Partial<TestEvent>>): Promise<void> {
        const now = new Date()
        const year = now.getUTCFullYear()
        const month = String(now.getUTCMonth() + 1).padStart(2, '0')
        const day = String(now.getUTCDate()).padStart(2, '0')
        const hours = String(now.getUTCHours()).padStart(2, '0')
        const minutes = String(now.getUTCMinutes()).padStart(2, '0')
        const seconds = String(now.getUTCSeconds()).padStart(2, '0')
        const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

        const eventDataList = events.map(event => {
            // 生成 UUID v4 格式的 ID（ClickHouse 的 UUID 类型要求标准格式）
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = (Math.random() * 16) | 0
                const v = c === 'x' ? r : (r & 0x3) | 0x8
                return v.toString(16)
            })

            return {
                id: event.id || uuid,
                app_id: appId,
                event_type: event.event_type || 'error',
                event_name: event.event_name || '',
                event_data: JSON.stringify(event.event_data || {}),
                path: event.path || '/test',
                user_agent: event.user_agent || 'TestAgent/1.0',
                timestamp,
                created_at: timestamp,

                // 错误字段
                error_message: event.error_message || '',
                error_stack: event.error_stack || '',
                error_lineno: event.error_lineno || 0,
                error_colno: event.error_colno || 0,
                error_fingerprint: event.error_fingerprint || '',

                // 设备信息
                device_browser: event.device_browser || 'Chrome',
                device_browser_version: event.device_browser_version || '120.0',
                device_os: event.device_os || 'macOS',
                device_os_version: event.device_os_version || '14.0',
                device_type: event.device_type || 'desktop',
                device_screen: event.device_screen || '1920x1080',

                // 网络信息
                network_type: event.network_type || '4g',
                network_rtt: event.network_rtt || 50,

                // 框架信息
                framework: event.framework || '',
                component_name: event.component_name || '',
                component_stack: event.component_stack || '',

                // HTTP 字段
                http_url: event.http_url || '',
                http_method: event.http_method || '',
                http_status: event.http_status || 0,
                http_duration: event.http_duration || 0,

                // 资源字段
                resource_url: event.resource_url || '',
                resource_type: event.resource_type || '',

                // Session 字段
                session_id: event.session_id || '',
                session_start_time: event.session_start_time || 0,
                session_duration: event.session_duration || 0,
                session_event_count: event.session_event_count || 0,
                session_error_count: event.session_error_count || 0,
                session_page_views: event.session_page_views || 0,

                // User 字段
                user_id: event.user_id || '',
                user_email: event.user_email || '',
                user_username: event.user_username || '',
                user_ip: event.user_ip || '',

                // Scope 字段
                tags: event.tags || '',
                extra: event.extra || '',
                breadcrumbs: event.breadcrumbs || '',
                contexts: event.contexts || '',

                // Level & Environment
                event_level: event.event_level || '',
                environment: event.environment || '',

                // Performance 字段
                perf_category: event.perf_category || '',
                perf_value: event.perf_value || 0,
                perf_is_slow: event.perf_is_slow || 0,
                perf_success: event.perf_success || 0,
                perf_metrics: event.perf_metrics || '',

                // 元数据
                dedup_count: event.dedup_count || 1,
                sampling_rate: event.sampling_rate || 1.0,
                sampling_sampled: event.sampling_sampled || 1,
            }
        })

        await this.clickhouseClient.insert({
            table: 'monitor_events',
            values: eventDataList,
            format: 'JSONEachRow',
        })
    }

    /**
     * 创建标准测试事件集合
     */
    createStandardTestEvents(sessionId: string, userId: string): TestEvent[] {
        const baseTime = Date.now()

        return [
            // 1. Session 开始事件
            {
                event_type: 'message',
                event_name: 'session_start',
                session_id: sessionId,
                session_start_time: baseTime,
                session_duration: 0,
                session_event_count: 1,
                session_error_count: 0,
                session_page_views: 1,
                user_id: userId,
                user_email: 'test@example.com',
                user_username: 'testuser',
                tags: JSON.stringify({ env: 'test', version: '1.0.0' }),
                breadcrumbs: JSON.stringify([{ message: 'App started', timestamp: baseTime }]),
            },
            // 2. 错误事件（带去重）
            {
                event_type: 'error',
                error_message: 'Test Error',
                error_stack: 'Error: Test Error\n  at test.js:1:1',
                error_fingerprint: 'test-error-fingerprint',
                session_id: sessionId,
                session_event_count: 2,
                session_error_count: 1,
                user_id: userId,
                dedup_count: 5,
                sampling_rate: 1.0,
                sampling_sampled: 1,
            },
            // 3. 慢请求事件
            {
                event_type: 'performance',
                perf_category: 'http',
                http_url: '/api/slow-endpoint',
                http_method: 'GET',
                http_status: 200,
                http_duration: 3500,
                perf_is_slow: 1,
                perf_success: 1,
                perf_value: 3500,
                session_id: sessionId,
                session_event_count: 3,
                user_id: userId,
            },
            // 4. Web Vitals 事件
            {
                event_type: 'webVital',
                event_name: 'LCP',
                perf_category: 'webvital',
                perf_value: 2500,
                session_id: sessionId,
                session_event_count: 4,
                user_id: userId,
                sampling_rate: 0.3,
                sampling_sampled: 1,
            },
            // 5. 失败的请求
            {
                event_type: 'performance',
                perf_category: 'http',
                http_url: '/api/error-endpoint',
                http_method: 'POST',
                http_status: 500,
                http_duration: 1000,
                perf_is_slow: 0,
                perf_success: 0,
                session_id: sessionId,
                session_event_count: 5,
                session_error_count: 1,
                user_id: userId,
            },
        ]
    }

    /**
     * 清理测试数据
     */
    async cleanupTestData(appId: string): Promise<void> {
        try {
            // ClickHouse 不支持 DELETE，使用 ALTER TABLE DELETE
            const query = `
                ALTER TABLE monitor_events
                DELETE WHERE app_id = '${appId}'
            `
            await this.clickhouseClient.command({ query })
        } catch (error) {
            console.error(`Failed to cleanup test data: ${error.message}`)
        }
    }

    /**
     * 删除测试应用
     */
    async deleteTestApp(appId: string): Promise<void> {
        try {
            await axios.delete(`${this.apiBaseUrl}/application`, {
                data: { appId },
                headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
            })
        } catch (error) {
            console.error(`Failed to delete test app: ${error.message}`)
        }
    }

    /**
     * 等待数据写入完成
     */
    async waitForDataSync(ms = 1000): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}

/**
 * 测试事件接口
 */
export interface TestEvent {
    id?: string
    event_type?: string
    event_name?: string
    event_data?: any
    path?: string
    user_agent?: string

    // 错误字段
    error_message?: string
    error_stack?: string
    error_lineno?: number
    error_colno?: number
    error_fingerprint?: string

    // 设备字段
    device_browser?: string
    device_browser_version?: string
    device_os?: string
    device_os_version?: string
    device_type?: string
    device_screen?: string

    // 网络字段
    network_type?: string
    network_rtt?: number

    // 框架字段
    framework?: string
    component_name?: string
    component_stack?: string

    // HTTP 字段
    http_url?: string
    http_method?: string
    http_status?: number
    http_duration?: number

    // 资源字段
    resource_url?: string
    resource_type?: string

    // Session 字段
    session_id?: string
    session_start_time?: number
    session_duration?: number
    session_event_count?: number
    session_error_count?: number
    session_page_views?: number

    // User 字段
    user_id?: string
    user_email?: string
    user_username?: string
    user_ip?: string

    // Scope 字段
    tags?: string
    extra?: string
    breadcrumbs?: string
    contexts?: string

    // Level & Environment
    event_level?: string
    environment?: string

    // Performance 字段
    perf_category?: string
    perf_value?: number
    perf_is_slow?: number
    perf_success?: number
    perf_metrics?: string

    // 元数据
    dedup_count?: number
    sampling_rate?: number
    sampling_sampled?: number
}
