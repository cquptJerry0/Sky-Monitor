import { Integration, MonitoringEvent } from '@sky-monitor/monitor-sdk-core'

/**
 * 会话配置
 */
export interface SessionConfig {
    /**
     * 会话超时时间（毫秒），默认30分钟
     */
    sessionTimeout?: number

    /**
     * 存储key，默认 'sky-monitor-session'
     */
    storageKey?: string
}

interface SessionData {
    sessionId: string
    startTime: number
    lastActivityTime: number
    eventCount: number
    errorCount: number
    pageViews: number
}

/**
 * 会话追踪集成
 * 为每个事件附加会话ID，统计会话级指标
 */
export class SessionIntegration implements Integration {
    name = 'Session'

    private session: SessionData | null = null
    private readonly sessionTimeout: number
    private readonly storageKey: string
    private isSetup = false

    // 保存事件监听器引用，用于清理
    private visibilityChangeHandler?: () => void
    private beforeUnloadHandler?: () => void

    constructor(config: SessionConfig = {}) {
        this.sessionTimeout = config.sessionTimeout ?? 30 * 60 * 1000 // 30分钟
        this.storageKey = config.storageKey ?? 'sky-monitor-session'
    }

    /**
     * 初始化
     */
    setupOnce(): void {
        // 防止重复初始化
        if (this.isSetup) {
            return
        }
        this.isSetup = true

        // 恢复或创建会话
        this.session = this.loadOrCreateSession()

        // 监听页面可见性变化
        this.setupVisibilityListener()

        // 页面卸载时上报会话数据
        this.setupUnloadListener()
    }

    /**
     * 事件发送前处理
     */
    beforeSend(event: MonitoringEvent): MonitoringEvent {
        if (!this.session) {
            this.session = this.createSession()
        }

        // 检查会话是否超时
        const now = Date.now()
        if (now - this.session.lastActivityTime > this.sessionTimeout) {
            this.endSession()
            this.session = this.createSession()
        }

        // 更新会话数据
        this.session.lastActivityTime = now
        this.session.eventCount++

        if (event.type === 'error') {
            this.session.errorCount++
        }

        // 附加会话信息
        event.sessionId = this.session.sessionId
        event._session = {
            startTime: this.session.startTime,
            duration: now - this.session.startTime,
            eventCount: this.session.eventCount,
            errorCount: this.session.errorCount,
            pageViews: this.session.pageViews,
        }

        this.saveSession()

        return event
    }

    /**
     * 创建新会话
     */
    private createSession(): SessionData {
        return {
            sessionId: this.generateSessionId(),
            startTime: Date.now(),
            lastActivityTime: Date.now(),
            eventCount: 0,
            errorCount: 0,
            pageViews: 1,
        }
    }

    /**
     * 生成会话ID
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * 加载或创建会话
     */
    private loadOrCreateSession(): SessionData {
        if (typeof sessionStorage === 'undefined') {
            return this.createSession()
        }

        try {
            const stored = sessionStorage.getItem(this.storageKey)
            if (stored) {
                const session = JSON.parse(stored)
                // 检查是否超时
                if (Date.now() - session.lastActivityTime < this.sessionTimeout) {
                    session.pageViews++
                    return session
                }
            }
        } catch {
            // sessionStorage 可能不可用或解析失败，忽略错误
        }

        return this.createSession()
    }

    /**
     * 保存会话
     */
    private saveSession(): void {
        if (typeof sessionStorage === 'undefined' || !this.session) {
            return
        }

        try {
            sessionStorage.setItem(this.storageKey, JSON.stringify(this.session))
        } catch {
            // sessionStorage 可能不可用，忽略错误
        }
    }

    /**
     * 结束会话
     */
    private endSession(): void {
        if (!this.session) return

        // 可选：发送会话摘要事件
        // 这里暂不实现，可以根据需要添加
    }

    /**
     * 监听页面可见性
     */
    private setupVisibilityListener(): void {
        if (typeof document === 'undefined') return

        this.visibilityChangeHandler = () => {
            if (document.hidden && this.session) {
                // 页面隐藏时保存会话
                this.saveSession()
            }
        }

        document.addEventListener('visibilitychange', this.visibilityChangeHandler)
    }

    /**
     * 页面卸载监听
     */
    private setupUnloadListener(): void {
        if (typeof window === 'undefined') return

        this.beforeUnloadHandler = () => {
            if (this.session) {
                this.saveSession()
                this.endSession()
            }
        }

        window.addEventListener('beforeunload', this.beforeUnloadHandler)
    }

    /**
     * 清理资源
     */
    cleanup(): void {
        // 保存当前会话
        if (this.session) {
            this.saveSession()
        }

        // 移除事件监听器
        if (this.visibilityChangeHandler) {
            document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
            this.visibilityChangeHandler = undefined
        }

        if (this.beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this.beforeUnloadHandler)
            this.beforeUnloadHandler = undefined
        }

        this.isSetup = false
    }
}
