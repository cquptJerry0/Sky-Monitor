import { Integration, captureEvent, getChinaTimestamp } from '@sky-monitor/monitor-sdk-core'
import { record } from 'rrweb'

/**
 * rrweb 事件类型
 */
interface eventWithTime {
    timestamp: number
    type: number
    data: unknown
}

/**
 * 录制模式
 */
export type RecordMode = 'always' | 'onError' | 'sampled'

/**
 * Session Replay 配置选项
 */
export interface SessionReplayOptions {
    /**
     * 录制模式
     * - 'always': 全程录制（性能开销大）
     * - 'onError': 错误时录制（推荐）
     * - 'sampled': 按采样率录制
     * 默认 'onError'
     */
    mode?: RecordMode

    /**
     * 采样率（0-1）
     * 仅在 mode='sampled' 时有效
     * 默认 0.1 (10%)
     */
    sampleRate?: number

    /**
     * 缓冲区时长（秒）
     * 保存最近 N 秒的录制数据
     * 默认 60 秒
     */
    bufferDuration?: number

    /**
     * 错误后继续录制时长（秒）
     * 错误发生后继续录制的时间
     * 默认 10 秒
     */
    afterErrorDuration?: number

    /**
     * 是否脱敏所有输入框
     * 默认 true
     */
    maskAllInputs?: boolean

    /**
     * 脱敏文本的 CSS 类名
     * 带有此类名的元素文本会被脱敏
     * 默认 'sky-monitor-mask'
     */
    maskTextClass?: string

    /**
     * 阻止录制的 CSS 类名
     * 带有此类名的元素不会被录制
     * 默认 'sky-monitor-block'
     */
    blockClass?: string

    /**
     * 忽略的 CSS 类名
     * 带有此类名的元素变化不会被记录
     * 默认 'sky-monitor-ignore'
     */
    ignoreClass?: string

    /**
     * 录制 FPS（帧率）
     * 默认 10 fps
     */
    fps?: number

    /**
     * 单次上报最大事件数
     * 默认 100
     */
    maxEvents?: number

    /**
     * 是否录制 Canvas
     * 默认 false（性能开销大）
     */
    recordCanvas?: boolean

    /**
     * 是否录制跨域 iframe
     * 默认 false（需要 iframe 配合）
     */
    recordCrossOriginIframes?: boolean
}

/**
 * Session Replay 集成
 *
 * 功能：
 * - 录制用户会话（DOM 快照 + 增量变更）
 * - 支持错误时回放
 * - 隐私脱敏（密码、敏感信息）
 * - 性能优化（缓冲区、采样、按需录制）
 *
 * 使用场景：
 * - 错误复现：回放错误发生时的用户操作
 * - 用户体验分析：观察用户交互过程
 * - Bug 调试：可视化复现问题
 *
 * 注意事项：
 * - 录制会增加性能开销，建议使用 'onError' 模式
 * - 需要注意用户隐私，默认已脱敏所有输入
 * - 录制数据较大，建议配置合理的缓冲区大小
 *
 * @example
 * ```typescript
 * new SessionReplayIntegration({
 *   mode: 'onError',           // 仅错误时录制
 *   maskAllInputs: true,       // 脱敏所有输入
 *   bufferDuration: 60,        // 保存最近 60 秒
 *   afterErrorDuration: 10,    // 错误后继续录制 10 秒
 *   recordCanvas: false        // 不录制 Canvas（性能考虑）
 * })
 * ```
 */
export class SessionReplayIntegration implements Integration {
    name = 'SessionReplay'

    private readonly options: Required<SessionReplayOptions>
    private stopRecording?: () => void
    private events: eventWithTime[] = []
    private lastFlushedEvents: eventWithTime[] = [] // 保存最后一次上报的事件(用于开发环境查看)
    private isRecording = false
    private errorOccurred = false
    private errorTimer?: any
    private currentReplayId: string | null = null
    private lastCleanupTime = 0 // 上次清理缓冲区的时间

    // 全局静态变量: 防止多个实例重复注册事件监听器
    // 这在 React StrictMode 下很重要,因为组件会被渲染 2 次,导致 SDK 初始化 2 次
    private static globalInstance: SessionReplayIntegration | null = null
    private static lastErrorTime = 0
    private static errorDebounceMs = 100

    constructor(options: SessionReplayOptions = {}) {
        this.options = {
            mode: options.mode ?? 'onError',
            sampleRate: options.sampleRate ?? 0.1,
            bufferDuration: options.bufferDuration ?? 60,
            afterErrorDuration: options.afterErrorDuration ?? 10,
            maskAllInputs: options.maskAllInputs ?? true,
            maskTextClass: options.maskTextClass ?? 'sky-monitor-mask',
            blockClass: options.blockClass ?? 'sky-monitor-block',
            ignoreClass: options.ignoreClass ?? 'sky-monitor-ignore',
            fps: options.fps ?? 10,
            maxEvents: options.maxEvents ?? 100,
            recordCanvas: options.recordCanvas ?? false,
            recordCrossOriginIframes: options.recordCrossOriginIframes ?? false,
        }

        // 保存全局实例引用
        SessionReplayIntegration.globalInstance = this
    }

    /**
     * 生成唯一的 Replay ID
     */
    private generateReplayId(): string {
        return `replay_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    }

    /**
     * 获取当前的 Replay ID
     * 供 ErrorsIntegration 使用，将 replayId 附加到错误事件上
     */
    getReplayId(): string | null {
        return this.currentReplayId
    }

    /**
     * 集成初始化
     * 根据录制模式决定何时开始录制
     */
    setupOnce(): void {
        const shouldRecord = this.shouldStartRecording()

        if (shouldRecord) {
            this.startRecording()
        }

        // 监听错误事件
        if (this.options.mode === 'onError') {
            this.listenForErrors()
        }
    }

    /**
     * 判断是否应该开始录制
     *
     * 决策逻辑：
     * - always: 总是录制
     * - onError: 不立即录制，等待错误
     * - sampled: 根据采样率决定
     */
    private shouldStartRecording(): boolean {
        const { mode, sampleRate } = this.options

        switch (mode) {
            case 'always':
                return true
            case 'onError':
                // onError 模式不立即录制，而是在缓冲区模式下录制
                // 这样错误发生时可以获取错误前的操作
                return true
            case 'sampled':
                return Math.random() < sampleRate
            default:
                return false
        }
    }

    /**
     * 开始录制会话
     *
     * 使用 rrweb.record() 开始录制
     * 配置隐私脱敏、性能优化等选项
     */
    private startRecording(): void {
        if (this.isRecording) return

        this.isRecording = true

        try {
            /**
             * 启动 rrweb 录制
             * emit 回调会在每次 DOM 变化时被调用
             */
            this.stopRecording = record({
                emit: event => {
                    this.handleEvent(event)
                },
                // 隐私保护配置
                maskAllInputs: this.options.maskAllInputs,
                maskTextClass: this.options.maskTextClass,
                blockClass: this.options.blockClass,
                ignoreClass: this.options.ignoreClass,
                // 性能优化配置
                sampling: {
                    // 鼠标移动采样：数字 = 采样间隔（毫秒），false = 不录制鼠标移动
                    mousemove: 50, // 每 50ms 记录一次鼠标移动
                    // 鼠标交互采样：false = 记录所有点击事件
                    mouseInteraction: false,
                    // 滚动事件采样：数字 = 采样间隔（毫秒）
                    scroll: 150, // 每 150ms 记录一次滚动
                    // 输入事件采样：'last' = 只记录最后的输入值
                    input: 'last',
                },
                // Canvas 录制（可选）
                recordCanvas: this.options.recordCanvas,
                // 跨域 iframe 录制（可选）
                recordCrossOriginIframes: this.options.recordCrossOriginIframes,
            })

            // 开发环境下输出录制状态
            if (typeof window !== 'undefined' && (window as any).__DEV__) {
                console.log('[SessionReplay] Recording started')
            }
        } catch (error) {
            // 开发环境下输出错误信息
            if (typeof window !== 'undefined' && (window as any).__DEV__) {
                console.error('[SessionReplay] Failed to start recording:', error)
            }
            this.isRecording = false
        }
    }

    /**
     * 处理录制事件
     *
     * 管理事件缓冲区：
     * - 正常情况: 保存最近 N 秒的事件,超出的会被丢弃
     * - 错误发生后: 不清理缓冲区,继续累积事件,以便收集"错误后10秒"的数据
     * - 优化: 每 5 秒清理一次过期事件,避免频繁清理影响性能
     *
     * @param event - rrweb 录制的事件
     */
    private handleEvent(event: any): void {
        this.events.push(event as eventWithTime)

        // 开发环境：打印错误后的事件
        if (typeof window !== 'undefined' && (window as any).__DEV__ && this.errorOccurred) {
            console.log('[SessionReplay] Event after error:', {
                type: event.type,
                timestamp: event.timestamp,
                eventsCount: this.events.length,
            })
        }

        /**
         * 如果错误已发生,不清理缓冲区
         * 这样可以保留"错误前60秒"的数据,同时收集"错误后10秒"的数据
         */
        if (this.errorOccurred) {
            return
        }

        /**
         * 正常情况下,定期清理过期事件
         * 每 5 秒清理一次,避免频繁清理影响性能
         * 只保留 bufferDuration 时间内的事件
         *
         * 重要：始终保留关键的初始化事件
         * - Meta 事件（type: 4）：包含页面 URL、宽高等元数据
         * - FullSnapshot 事件（type: 2）：完整的 DOM 快照
         * rrweb 回放器需要这些事件来初始化
         */
        const now = Date.now()
        const cleanupInterval = 5000 // 5 秒清理一次

        if (now - this.lastCleanupTime > cleanupInterval) {
            const bufferMs = this.options.bufferDuration * 1000
            const cutoffTime = now - bufferMs

            // 找到第一个 Meta 事件（type: 4）和第一个 FullSnapshot 事件（type: 2）
            // rrweb EventType: 0=DomContentLoaded, 1=Load, 2=FullSnapshot, 3=IncrementalSnapshot, 4=Meta, 5=Custom
            const firstMeta = this.events.find(e => e.type === 4)
            const firstFullSnapshot = this.events.find(e => e.type === 2)

            this.events = this.events.filter(e => {
                // 始终保留第一个 Meta 事件（type: 4）
                if (firstMeta && e === firstMeta) {
                    return true
                }
                // 始终保留第一个 FullSnapshot（type: 2）
                if (firstFullSnapshot && e === firstFullSnapshot) {
                    return true
                }
                // 保留 cutoffTime 之后的事件
                return e.timestamp >= cutoffTime
            })

            this.lastCleanupTime = now
        }
    }

    /**
     * 检查是否是 SDK 错误
     * 防止 SDK 自身错误触发 Replay 上报
     */
    private isSdkError(error: any): boolean {
        if (!error) return false

        const message = error instanceof Error ? error.message : String(error)
        const stack = error instanceof Error ? error.stack : ''

        // 检查错误消息
        const messagePatterns = [
            'HTTP error! status:',
            '[BrowserTransport]',
            '[BatchedTransport]',
            '[SessionReplayTransport]',
            'Sky-Monitor',
        ]

        if (messagePatterns.some(pattern => message.includes(pattern))) {
            return true
        }

        // 检查堆栈
        const sdkPatterns = [
            '@sky-monitor/monitor-sdk',
            'transport/index',
            'transport/batched',
            'transport/session-replay',
            'transport/transport-router',
        ]

        return stack ? sdkPatterns.some(pattern => stack.includes(pattern)) : false
    }

    /**
     * 监听错误事件
     *
     * 在错误发生时：
     * 1. 标记错误已发生
     * 2. 上报缓冲区中的所有事件
     * 3. 继续录制 afterErrorDuration 时长
     * 4. 停止录制
     *
     * 防止重复触发:
     * - 同一个错误可能同时触发 error 和 unhandledrejection 事件
     * - 使用全局静态变量防抖,100ms 内只处理一次错误
     * - 使用全局实例引用,确保只有一个实例处理错误
     */
    private listenForErrors(): void {
        /**
         * 监听全局错误
         */
        window.addEventListener('error', event => {
            // 过滤 SDK 自身错误,防止无限循环
            if (this.isSdkError(event.error)) {
                return
            }

            // 只让全局实例处理错误（必须先检查，避免非全局实例更新 lastErrorTime）
            if (SessionReplayIntegration.globalInstance !== this) {
                return
            }

            // 防抖: 100ms 内只处理一次错误 (使用全局静态变量)
            const now = Date.now()
            const timeSinceLastError = now - SessionReplayIntegration.lastErrorTime

            if (timeSinceLastError < SessionReplayIntegration.errorDebounceMs) {
                return
            }
            SessionReplayIntegration.lastErrorTime = now

            this.handleError()
        })

        /**
         * 监听未处理的 Promise 拒绝
         */
        window.addEventListener('unhandledrejection', event => {
            // 过滤 SDK 自身错误,防止无限循环
            if (this.isSdkError(event.reason)) {
                return
            }

            // 只让全局实例处理错误（必须先检查，避免非全局实例更新 lastErrorTime）
            if (SessionReplayIntegration.globalInstance !== this) {
                return
            }

            // 防抖: 100ms 内只处理一次错误 (使用全局静态变量)
            const now = Date.now()
            const timeSinceLastError = now - SessionReplayIntegration.lastErrorTime

            if (timeSinceLastError < SessionReplayIntegration.errorDebounceMs) {
                return
            }
            SessionReplayIntegration.lastErrorTime = now

            this.handleError()
        })
    }

    /**
     * 处理错误事件
     *
     * 执行流程（修复后）：
     * 1. 生成唯一的 replayId
     * 2. 标记错误已发生,记录错误时间
     * 3. 不立即上报,继续录制 afterErrorDuration 时长
     * 4. afterErrorDuration 后一次性上报完整数据（错误前60秒 + 错误后10秒）
     *
     * 改进：
     * - 只上报1次 replay 事件（而不是2次）
     * - 上报的数据包含完整的"错误前60秒 + 错误后10秒"
     * - 允许多次触发 Replay，每次错误都生成新的 replayId
     */
    private handleError(): void {
        // 如果正在处理错误，清除之前的定时器
        if (this.errorTimer) {
            clearTimeout(this.errorTimer)
        }

        // 生成唯一的 Replay ID（每次错误都生成新的）
        this.currentReplayId = this.generateReplayId()
        this.errorOccurred = true

        // 开发环境：打印错误触发信息
        if (typeof window !== 'undefined' && (window as any).__DEV__) {
            console.log('[SessionReplay] Error occurred, will flush after 10s:', {
                replayId: this.currentReplayId,
                eventsCount: this.events.length,
                errorTime: new Date().toISOString(),
            })
        }

        // 不立即上报，继续录制 afterErrorDuration 时长
        // 这样可以收集"错误后10秒"的数据

        /**
         * afterErrorDuration 后一次性上报完整数据
         */
        this.errorTimer = window.setTimeout(() => {
            // 一次性上报完整的 replay 数据（错误前60秒 + 错误后10秒）
            this.flushEvents()

            // 重置错误标记和 replayId，允许下次错误再次录制
            this.errorOccurred = false
            this.currentReplayId = null

            // onError 模式下，清空缓冲区，继续录制（不停止）
            // 这样下次错误还能继续上报
            if (this.options.mode === 'onError') {
                this.events = []
            }
        }, this.options.afterErrorDuration * 1000) as any
    }

    /**
     * 上报录制事件
     *
     * 将缓冲区中的所有事件上报到服务器
     * 创建 type: 'replay' 事件（符合 Sentry 标准）
     * 上报后清空缓冲区
     *
     * 修复后的逻辑：
     * - 创建事件快照,用于上报和开发环境查看
     * - 上报快照数据,而不是直接引用 this.events
     * - 保存快照到 lastFlushedEvents,供 getRecordedEvents() 使用
     */
    private flushEvents(): void {
        if (this.events.length === 0) {
            return
        }

        // 创建事件快照
        const eventsSnapshot = [...this.events]
        const duration = this.calculateDuration()
        const eventCount = eventsSnapshot.length

        // 开发环境：打印上报信息
        if (typeof window !== 'undefined' && (window as any).__DEV__) {
            const firstEvent = eventsSnapshot[0]
            const lastEvent = eventsSnapshot[eventsSnapshot.length - 1]
            console.log('[SessionReplay] Flushing events:', {
                replayId: this.currentReplayId,
                eventCount,
                duration,
                firstEventTime: firstEvent ? new Date(firstEvent.timestamp).toISOString() : null,
                lastEventTime: lastEvent ? new Date(lastEvent.timestamp).toISOString() : null,
                flushTime: new Date().toISOString(),
            })
        }

        /**
         * 上报录制数据
         * 使用 type: 'replay' 事件类型（不再使用 custom + category）
         * 包含 replayId 用于与错误事件关联
         */
        const replayEvent = {
            type: 'replay',
            replayId: this.currentReplayId || this.generateReplayId(),
            events: eventsSnapshot, // 使用快照,而不是 this.events
            metadata: {
                eventCount,
                duration,
                compressed: false, // 暂时不压缩，由 Transport 层处理
                originalSize: JSON.stringify(eventsSnapshot).length,
                compressedSize: 0,
            },
            trigger: this.errorOccurred ? 'error' : 'manual',
            timestamp: getChinaTimestamp(),
        }

        captureEvent(replayEvent as any)

        // 保存快照到 lastFlushedEvents (用于开发环境查看)
        this.lastFlushedEvents = eventsSnapshot

        // 清空已上报的事件
        this.events = []
    }

    /**
     * 计算录制时长
     *
     * @returns 录制时长（秒）
     */
    private calculateDuration(): number {
        if (this.events.length === 0) return 0

        const firstEvent = this.events[0]
        const lastEvent = this.events[this.events.length - 1]

        if (!firstEvent || !lastEvent) return 0

        return Math.round((lastEvent.timestamp - firstEvent.timestamp) / 1000)
    }

    /**
     * 停止录制会话
     */
    private stopRecordingSession(): void {
        if (this.stopRecording) {
            this.stopRecording()
            this.stopRecording = undefined
        }

        this.isRecording = false
    }

    /**
     * 清理资源
     * 停止录制，清空缓冲区
     */
    cleanup(): void {
        // 最后一次上报（如果有未上报的事件）
        this.flushEvents()

        // 停止录制
        this.stopRecordingSession()

        // 清理定时器
        if (this.errorTimer) {
            clearTimeout(this.errorTimer)
            this.errorTimer = undefined
        }

        // 清空事件缓冲
        this.events = []
    }

    /**
     * 获取录制的事件(仅用于开发环境)
     * 用于在开发时查看录制的内容
     *
     * 正确的逻辑：
     * - 优先返回最后一次上报的完整录像 (lastFlushedEvents) - 包含错误前60秒 + 错误后10秒
     * - 如果还没上报过,返回当前正在录制的数据 (this.events)
     *
     * @returns 录制的 rrweb events
     */
    getRecordedEvents(): eventWithTime[] {
        // 优先返回上报后的完整录像 (60s + 10s)
        if (this.lastFlushedEvents.length > 0) {
            return [...this.lastFlushedEvents]
        }
        // 如果还没上报,返回当前正在录制的数据
        return [...this.events]
    }

    /**
     * 获取当前录制状态(仅用于开发环境)
     *
     * @returns 录制状态信息
     */
    getRecordingStatus() {
        return {
            isRecording: this.isRecording,
            errorOccurred: this.errorOccurred,
            eventsCount: this.events.length,
            replayId: this.currentReplayId,
            duration: this.calculateDuration(),
        }
    }
}
