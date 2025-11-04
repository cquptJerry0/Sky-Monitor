import { EventPipeline } from './pipeline'
import { ScopeImpl } from './scope'
import { Transport } from './transport'
import { Breadcrumb, Integration, MonitoringEvent, Scope, User } from './types'

// 全局客户端实例
let currentClient: Monitoring | null = null

/**
 * 获取当前客户端实例
 */
export function getCurrentClient(): Monitoring | null {
    return currentClient
}

/**
 * 设置当前客户端实例
 */
export function setCurrentClient(client: Monitoring | null): void {
    currentClient = client
}

export class Monitoring {
    private pipeline = new EventPipeline()
    private integrations: Integration[] = []
    private transport: Transport | null = null
    private setupOnceCalled = false
    private globalScope = new ScopeImpl()
    private release?: string

    /**
     * 添加集成
     */
    addIntegration(integration: Integration): this {
        this.integrations.push(integration)
        return this
    }

    /**
     * 按优先级排序 integrations
     * 优先级数值越小越先执行，默认为 50
     */
    private sortIntegrationsByPriority(): Integration[] {
        return [...this.integrations].sort((a, b) => {
            const priorityA = a.priority ?? 50
            const priorityB = b.priority ?? 50
            return priorityA - priorityB
        })
    }

    /**
     * 初始化监控系统
     * 支持异步初始化
     */
    async init(transport: Transport, options?: { release?: string }): Promise<void> {
        this.transport = transport
        this.release = options?.release

        // 设置为当前客户端
        setCurrentClient(this)

        // 按优先级排序
        const sortedIntegrations = this.sortIntegrationsByPriority()

        // Step 1: 执行所有setupOnce（仅一次）
        if (!this.setupOnceCalled) {
            sortedIntegrations.forEach(int => int.setupOnce?.())
            this.setupOnceCalled = true
        }

        // Step 2: 执行所有init（支持异步）
        for (const integration of sortedIntegrations) {
            if (integration.init) {
                await integration.init(transport)
            }
        }

        // Step 3: 注册所有beforeSend到管道
        sortedIntegrations.forEach(int => {
            if (int.beforeSend) {
                this.pipeline.use(event => int.beforeSend!(event))
            }
        })
    }

    /**
     * 捕获事件（通过管道处理）
     */
    async captureEvent(event: MonitoringEvent): Promise<void> {
        // 应用 Scope 上下文
        let enrichedEvent = this.globalScope.applyToEvent(event)

        // 添加 release 信息
        if (this.release) {
            enrichedEvent = { ...enrichedEvent, release: this.release }
        }

        // 通过管道处理
        const processed = await this.pipeline.execute(enrichedEvent)

        if (processed && this.transport) {
            this.transport.send(processed as unknown as Record<string, unknown>)
        }
    }

    /**
     * 兼容旧API - 报告消息
     */
    reportMessage(message: string): void {
        this.captureEvent({ type: 'message', message })
    }

    /**
     * 兼容旧API - 报告自定义事件
     */
    reportEvent(event: unknown): void {
        this.captureEvent({ type: 'custom', event })
    }

    /**
     * 刷新传输缓冲区
     * 如果transport支持flush，则立即发送所有缓存的事件
     */
    async flush(): Promise<void> {
        if (this.transport?.flush) {
            await this.transport.flush()
        }
    }

    /**
     * 配置全局 Scope
     */
    configureScope(callback: (scope: Scope) => void): void {
        callback(this.globalScope)
    }

    /**
     * 设置用户信息
     */
    setUser(user: User | null): void {
        this.globalScope.setUser(user)
    }

    /**
     * 设置标签
     */
    setTag(key: string, value: string): void {
        this.globalScope.setTag(key, value)
    }

    /**
     * 添加面包屑
     */
    addBreadcrumb(breadcrumb: Breadcrumb): void {
        this.globalScope.addBreadcrumb(breadcrumb)
    }

    /**
     * 关闭并清理资源
     * 支持异步清理
     */
    async close(): Promise<void> {
        // 刷新传输缓冲区
        await this.flush()

        // 按优先级倒序清理 integrations（后进先出）
        const sortedIntegrations = this.sortIntegrationsByPriority().reverse()
        for (const integration of sortedIntegrations) {
            if (integration.cleanup) {
                await integration.cleanup()
            }
        }

        // 关闭传输
        if (this.transport?.close) {
            await this.transport.close()
        }

        this.transport = null
        setCurrentClient(null)
    }
}

/**
 * 全局便捷函数 - 设置用户信息
 */
export function setUser(user: User | null): void {
    const client = getCurrentClient()
    if (client) {
        client.setUser(user)
    }
}

/**
 * 全局便捷函数 - 设置标签
 */
export function setTag(key: string, value: string): void {
    const client = getCurrentClient()
    if (client) {
        client.setTag(key, value)
    }
}

/**
 * 全局便捷函数 - 添加面包屑
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
    const client = getCurrentClient()
    if (client) {
        client.addBreadcrumb(breadcrumb)
    }
}

/**
 * 全局便捷函数 - 配置 Scope
 */
export function configureScope(callback: (scope: Scope) => void): void {
    const client = getCurrentClient()
    if (client) {
        client.configureScope(callback)
    }
}
