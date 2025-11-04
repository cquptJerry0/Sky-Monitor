import type { Breadcrumb, EventLevel, MonitoringEvent, Scope, User } from './types'

const MAX_BREADCRUMBS = 100

/**
 * Scope 实现
 * 存储和管理事件上下文信息
 */
export class ScopeImpl implements Scope {
    private user: User | null = null
    private tags: Record<string, string> = {}
    private extras: Record<string, unknown> = {}
    private breadcrumbs: Breadcrumb[] = []
    private contexts: Record<string, Record<string, unknown> | null> = {}
    private level?: EventLevel

    /**
     * 设置用户信息
     */
    setUser(user: User | null): void {
        this.user = user
    }

    getUser(): User | null {
        return this.user
    }

    /**
     * 设置标签
     */
    setTag(key: string, value: string): void {
        this.tags[key] = value
    }

    setTags(tags: Record<string, string>): void {
        this.tags = { ...this.tags, ...tags }
    }

    getTags(): Record<string, string> {
        return { ...this.tags }
    }

    /**
     * 设置额外数据
     */
    setExtra(key: string, value: unknown): void {
        this.extras[key] = value
    }

    setExtras(extras: Record<string, unknown>): void {
        this.extras = { ...this.extras, ...extras }
    }

    getExtras(): Record<string, unknown> {
        return { ...this.extras }
    }

    /**
     * 添加面包屑
     */
    addBreadcrumb(breadcrumb: Breadcrumb): void {
        const crumb: Breadcrumb = {
            timestamp: Date.now(),
            level: 'info',
            ...breadcrumb,
        }

        this.breadcrumbs.push(crumb)

        // 限制面包屑数量
        if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
            this.breadcrumbs.shift()
        }
    }

    getBreadcrumbs(): Breadcrumb[] {
        return [...this.breadcrumbs]
    }

    /**
     * 设置上下文
     */
    setContext(name: string, context: Record<string, unknown> | null): void {
        this.contexts[name] = context
    }

    getContext(name: string): Record<string, unknown> | null {
        return this.contexts[name] || null
    }

    /**
     * 设置级别
     */
    setLevel(level: EventLevel): void {
        this.level = level
    }

    getLevel(): EventLevel | undefined {
        return this.level
    }

    /**
     * 清空所有数据
     */
    clear(): void {
        this.user = null
        this.tags = {}
        this.extras = {}
        this.breadcrumbs = []
        this.contexts = {}
        this.level = undefined
    }

    /**
     * 克隆当前 Scope
     */
    clone(): ScopeImpl {
        const newScope = new ScopeImpl()
        newScope.user = this.user ? { ...this.user } : null
        newScope.tags = { ...this.tags }
        newScope.extras = { ...this.extras }
        newScope.breadcrumbs = [...this.breadcrumbs]
        newScope.contexts = { ...this.contexts }
        newScope.level = this.level
        return newScope
    }

    /**
     * 将 Scope 数据应用到事件
     */
    applyToEvent(event: MonitoringEvent): MonitoringEvent {
        const enrichedEvent = { ...event }

        // 添加用户信息
        if (this.user) {
            enrichedEvent.user = this.user
        }

        // 添加标签
        if (Object.keys(this.tags).length > 0) {
            enrichedEvent.tags = { ...this.tags, ...((event.tags as Record<string, string>) || {}) }
        }

        // 添加额外数据
        if (Object.keys(this.extras).length > 0) {
            enrichedEvent.extra = { ...this.extras, ...((event.extra as Record<string, unknown>) || {}) }
        }

        // 添加面包屑
        if (this.breadcrumbs.length > 0) {
            enrichedEvent.breadcrumbs = [...this.breadcrumbs]
        }

        // 添加上下文
        if (Object.keys(this.contexts).length > 0) {
            enrichedEvent.contexts = { ...this.contexts }
        }

        // 添加级别
        if (this.level && !event.level) {
            enrichedEvent.level = this.level
        }

        return enrichedEvent
    }
}
