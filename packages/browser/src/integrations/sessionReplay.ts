import { Integration, MonitoringEvent, ReplayData } from '@sky-monitor/monitor-sdk-core'
import { record, RecordPlugin } from 'rrweb'
import type { eventWithTime } from 'rrweb'

/**
 * Session Replay 配置接口
 * 用于控制会话录制的行为和性能
 */
export interface SessionReplayConfig {
    /**
     * 录制模式
     * - always: 全程录制（性能开销大，适用于关键页面）
     * - onError: 仅在错误发生时上报录制数据（推荐，平衡性能和调试价值）
     * - sampled: 按采样率录制（适用于生产环境大规模监控）
     * @default 'onError'
     */
    mode?: 'always' | 'onError' | 'sampled'

    /**
     * 采样率（仅在 sampled 模式下生效）
     * 取值范围 0-1，例如 0.1 表示 10% 的会话被录制
     * @default 0.1
     */
    sampleRate?: number

    /**
     * 最大缓冲时长（秒）
     * 内存中保留最近 N 秒的录制数据，超过此时长的旧数据会被清理
     * @default 60
     */
    maxBufferDuration?: number

    /**
     * 错误发生后继续录制的时长（秒）
     * 用于捕获错误发生后用户的后续操作
     * @default 10
     */
    postErrorDuration?: number

    /**
     * 最大事件数量
     * 限制内存中存储的事件总数，防止内存溢出
     * @default 1000
     */
    maxEvents?: number

    /**
     * 最大上报数据大小（字节）
     * 超过此大小会进行截断或压缩
     * @default 2097152 (2MB)
     */
    maxUploadSize?: number

    /**
     * 录制帧率（FPS）
     * 降低帧率可以减少性能开销和数据量
     * @default 10
     */
    fps?: number

    /**
     * 是否启用数据压缩
     * 注意：需要额外安装 pako 库
     * @default false
     */
    enableCompression?: boolean

    /**
     * 是否使用 sessionStorage 缓存录制数据
     * 启用后页面刷新可以保留录制数据
     * @default true
     */
    useSessionStorage?: boolean

    /**
     * sessionStorage 的 key 名称
     * @default 'sky-monitor-replay'
     */
    storageKey?: string

    /**
     * 是否遮罩所有输入框内容
     * @default true
     */
    maskAllInputs?: boolean

    /**
     * 是否遮罩所有文本内容
     * @default false
     */
    maskAllText?: boolean

    /**
     * 需要完全隐藏的元素 class 名称
     * 这些元素会被替换为占位符
     * @default 'sky-monitor-block'
     */
    blockClass?: string

    /**
     * 需要遮罩文本的元素 class 名称
     * @default 'sky-monitor-mask'
     */
    maskTextClass?: string

    /**
     * 需要忽略的元素 class 名称
     * 这些元素及其子元素不会被录制
     * @default 'sky-monitor-ignore'
     */
    ignoreClass?: string

    /**
     * 自定义插件列表
     */
    plugins?: RecordPlugin[]
}

/**
 * Session Replay Integration
 *
 * 基于 rrweb 实现的会话重放功能，支持：
 * - 多种录制模式（always / onError / sampled）
 * - 智能缓冲区管理（60秒滑动窗口）
 * - 隐私保护（输入框遮罩、敏感元素过滤）
 * - 性能优化（FPS限制、数据大小控制）
 * - 持久化支持（sessionStorage 缓存）
 *
 * @example
 * ```typescript
 * const monitoring = init({
 *   dsn: 'http://localhost:8080/api/v1/monitoring/xxx',
 *   integrations: [
 *     new SessionReplayIntegration({
 *       mode: 'onError',
 *       maxBufferDuration: 60,
 *       postErrorDuration: 10,
 *       maskAllInputs: true
 *     })
 *   ]
 * })
 * ```
 */
export class SessionReplayIntegration implements Integration {
    name = 'SessionReplay'
    priority = 30 // 较低优先级，不影响错误捕获

    private config: Required<SessionReplayConfig>
    private events: eventWithTime[] = []
    private stopRecordFn?: () => void
    private isRecording = false
    private isSetup = false
    private bufferStartTime = 0
    private errorTriggered = false
    private postErrorTimer?: NodeJS.Timeout

    // 保存事件监听器引用，用于清理
    private beforeUnloadHandler?: () => void
    private visibilityChangeHandler?: () => void

    constructor(config: SessionReplayConfig = {}) {
        // 合并默认配置
        this.config = {
            mode: config.mode ?? 'onError',
            sampleRate: config.sampleRate ?? 0.1,
            maxBufferDuration: config.maxBufferDuration ?? 60,
            postErrorDuration: config.postErrorDuration ?? 10,
            maxEvents: config.maxEvents ?? 1000,
            maxUploadSize: config.maxUploadSize ?? 2 * 1024 * 1024, // 2MB
            fps: config.fps ?? 10,
            enableCompression: config.enableCompression ?? false,
            useSessionStorage: config.useSessionStorage ?? true,
            storageKey: config.storageKey ?? 'sky-monitor-replay',
            maskAllInputs: config.maskAllInputs ?? true,
            maskAllText: config.maskAllText ?? false,
            blockClass: config.blockClass ?? 'sky-monitor-block',
            maskTextClass: config.maskTextClass ?? 'sky-monitor-mask',
            ignoreClass: config.ignoreClass ?? 'sky-monitor-ignore',
            plugins: config.plugins ?? [],
        }
    }

    /**
     * 全局初始化钩子
     * 根据录制模式决定是否立即开始录制
     */
    setupOnce(): void {
        // 防止重复初始化
        if (this.isSetup) {
            return
        }
        this.isSetup = true

        // 检查浏览器支持
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return
        }

        // 根据模式决定是否立即录制
        switch (this.config.mode) {
            case 'always':
                // 全程录制模式：立即开始
                this.startRecording()
                break

            case 'onError':
                // 错误触发模式：预先录制到缓冲区，但不上报
                this.startRecording()
                break

            case 'sampled':
                // 采样模式：按概率决定是否录制
                if (Math.random() < this.config.sampleRate) {
                    this.startRecording()
                }
                break
        }

        // 监听页面卸载，保存数据
        if (this.config.useSessionStorage) {
            this.setupUnloadListener()
        }

        // 从 sessionStorage 恢复数据
        this.restoreFromStorage()
    }

    /**
     * 事件发送前钩子
     * 在错误事件中附加 replay 数据
     *
     * @param event - 监控事件
     * @returns 处理后的事件（可能包含 replay 数据）
     */
    beforeSend(event: MonitoringEvent): MonitoringEvent {
        // 仅在错误事件中附加 replay 数据
        if (event.type !== 'error') {
            return event
        }

        // onError 模式：第一次错误时标记触发
        if (this.config.mode === 'onError' && !this.errorTriggered) {
            this.errorTriggered = true

            // 继续录制后续 N 秒
            this.scheduleStopRecording(this.config.postErrorDuration * 1000)
        }

        // 附加 replay 数据
        const replayData = this.extractReplayData()
        if (replayData) {
            event.replay = replayData
        }

        return event
    }

    /**
     * 清理资源
     * 停止录制，清空缓冲区
     */
    cleanup(): void {
        this.stopRecording()
        this.clearBuffer()

        if (this.postErrorTimer) {
            clearTimeout(this.postErrorTimer)
            this.postErrorTimer = undefined
        }

        // 移除事件监听器
        if (this.beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this.beforeUnloadHandler)
            this.beforeUnloadHandler = undefined
        }

        if (this.visibilityChangeHandler) {
            document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
            this.visibilityChangeHandler = undefined
        }

        this.isSetup = false
    }

    /**
     * 启动录制
     * 使用 rrweb 进行 DOM 快照和变更监听
     *
     * @private
     */
    private startRecording(): void {
        if (this.isRecording) {
            return
        }

        try {
            this.stopRecordFn = record({
                emit: event => {
                    this.handleReplayEvent(event)
                },
                // 隐私保护配置
                maskAllInputs: this.config.maskAllInputs,
                maskAllText: this.config.maskAllText,
                blockClass: this.config.blockClass,
                maskTextClass: this.config.maskTextClass,
                ignoreClass: this.config.ignoreClass,
                // 性能优化配置
                sampling: {
                    // 限制鼠标移动事件的采样
                    mousemove: true,
                    mouseInteraction: {
                        MouseUp: false,
                        MouseDown: false,
                        Click: true,
                        ContextMenu: false,
                        DblClick: false,
                        Focus: false,
                        Blur: false,
                        TouchStart: false,
                        TouchEnd: false,
                    },
                    // 限制滚动事件的采样
                    scroll: 150, // 150ms 节流
                    // 限制输入事件的采样
                    input: 'last', // 只记录最后一次输入
                },
                // 自定义插件
                plugins: this.config.plugins,
            })

            this.isRecording = true
            this.bufferStartTime = Date.now()
        } catch (error) {
            // 录制启动失败，静默处理
            this.isRecording = false
        }
    }

    /**
     * 停止录制
     *
     * @private
     */
    private stopRecording(): void {
        if (!this.isRecording || !this.stopRecordFn) {
            return
        }

        this.stopRecordFn()
        this.stopRecordFn = undefined
        this.isRecording = false
    }

    /**
     * 暂停录制
     * 保留当前数据，可以恢复
     *
     * @private
     */
    private pauseRecording(): void {
        this.stopRecording()
    }

    /**
     * 恢复录制
     *
     * @private
     */
    private resumeRecording(): void {
        this.startRecording()
    }

    /**
     * 处理 rrweb 录制的事件
     * 实现滑动窗口缓冲区管理
     *
     * @param event - rrweb 事件
     * @private
     */
    private handleReplayEvent(event: eventWithTime): void {
        // 添加到缓冲区
        this.events.push(event)

        // 清理超过缓冲时长的旧事件
        this.pruneOldEvents()

        // 限制事件总数
        if (this.events.length > this.config.maxEvents) {
            this.events.shift()
        }

        // 定期保存到 sessionStorage
        if (this.config.useSessionStorage && this.events.length % 10 === 0) {
            this.saveToStorage()
        }
    }

    /**
     * 清理超过缓冲时长的旧事件
     * 实现 60 秒滑动窗口
     *
     * @private
     */
    private pruneOldEvents(): void {
        const now = Date.now()
        const maxAge = this.config.maxBufferDuration * 1000

        // 找到第一个在时间窗口内的事件索引
        let firstValidIndex = 0
        for (let i = 0; i < this.events.length; i++) {
            if (now - this.events[i].timestamp < maxAge) {
                firstValidIndex = i
                break
            }
        }

        // 移除过期事件
        if (firstValidIndex > 0) {
            this.events = this.events.slice(firstValidIndex)
        }
    }

    /**
     * 提取 replay 数据用于上报
     *
     * @returns 格式化的 replay 数据
     * @private
     */
    private extractReplayData(): ReplayData | null {
        if (this.events.length === 0) {
            return null
        }

        const startTime = this.events[0].timestamp
        const endTime = this.events[this.events.length - 1].timestamp
        const duration = endTime - startTime

        // 估算数据大小
        const eventsJson = JSON.stringify(this.events)
        const size = new Blob([eventsJson]).size

        // 检查是否超过最大上报大小
        let finalEvents = this.events
        if (size > this.config.maxUploadSize) {
            // 截断事件，保留最近的数据
            const ratio = this.config.maxUploadSize / size
            const keepCount = Math.floor(this.events.length * ratio)
            finalEvents = this.events.slice(-keepCount)
        }

        return {
            events: finalEvents,
            startTime,
            endTime,
            duration,
            eventCount: finalEvents.length,
            compressed: false,
            size,
            mode: this.config.mode,
        }
    }

    /**
     * 清空缓冲区
     *
     * @private
     */
    private clearBuffer(): void {
        this.events = []
        this.bufferStartTime = 0

        if (this.config.useSessionStorage) {
            this.clearStorage()
        }
    }

    /**
     * 定时停止录制
     * 用于 onError 模式下，错误发生后继续录制 N 秒
     *
     * @param delay - 延迟时间（毫秒）
     * @private
     */
    private scheduleStopRecording(delay: number): void {
        // 清除之前的定时器
        if (this.postErrorTimer) {
            clearTimeout(this.postErrorTimer)
        }

        // 设置新的定时器
        this.postErrorTimer = setTimeout(() => {
            this.stopRecording()
            this.postErrorTimer = undefined
        }, delay)
    }

    /**
     * 保存录制数据到 sessionStorage
     * 支持页面刷新后恢复
     *
     * @private
     */
    private saveToStorage(): void {
        if (typeof sessionStorage === 'undefined') {
            return
        }

        try {
            const data = {
                events: this.events,
                bufferStartTime: this.bufferStartTime,
                errorTriggered: this.errorTriggered,
                timestamp: Date.now(),
            }

            sessionStorage.setItem(this.config.storageKey, JSON.stringify(data))
        } catch (error) {
            // sessionStorage 可能已满或不可用，忽略错误
        }
    }

    /**
     * 从 sessionStorage 恢复录制数据
     *
     * @private
     */
    private restoreFromStorage(): void {
        if (typeof sessionStorage === 'undefined') {
            return
        }

        try {
            const stored = sessionStorage.getItem(this.config.storageKey)
            if (!stored) {
                return
            }

            const data = JSON.parse(stored)

            // 检查数据是否过期（超过缓冲时长）
            const now = Date.now()
            if (now - data.timestamp > this.config.maxBufferDuration * 1000) {
                this.clearStorage()
                return
            }

            // 恢复数据
            this.events = data.events || []
            this.bufferStartTime = data.bufferStartTime || 0
            this.errorTriggered = data.errorTriggered || false

            // 清理过期事件
            this.pruneOldEvents()
        } catch (error) {
            // 解析失败，清除数据
            this.clearStorage()
        }
    }

    /**
     * 清除 sessionStorage 中的数据
     *
     * @private
     */
    private clearStorage(): void {
        if (typeof sessionStorage === 'undefined') {
            return
        }

        try {
            sessionStorage.removeItem(this.config.storageKey)
        } catch {
            // 忽略错误
        }
    }

    /**
     * 监听页面卸载事件
     * 在页面关闭前保存数据
     *
     * @private
     */
    private setupUnloadListener(): void {
        if (typeof window === 'undefined') {
            return
        }

        this.beforeUnloadHandler = () => {
            this.saveToStorage()
        }

        this.visibilityChangeHandler = () => {
            if (document.hidden) {
                this.saveToStorage()
            }
        }

        window.addEventListener('beforeunload', this.beforeUnloadHandler)
        document.addEventListener('visibilitychange', this.visibilityChangeHandler)
    }

    /**
     * 获取当前录制状态
     *
     * @returns 录制状态信息
     */
    getStatus(): {
        isRecording: boolean
        eventCount: number
        bufferDuration: number
        estimatedSize: number
    } {
        const now = Date.now()
        const bufferDuration = this.bufferStartTime > 0 ? now - this.bufferStartTime : 0
        const estimatedSize = new Blob([JSON.stringify(this.events)]).size

        return {
            isRecording: this.isRecording,
            eventCount: this.events.length,
            bufferDuration,
            estimatedSize,
        }
    }
}
