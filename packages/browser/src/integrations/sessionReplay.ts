import { Integration, captureEvent } from '@sky-monitor/monitor-sdk-core'
import { record } from 'rrweb'

/**
 * rrweb 事件类型
 * timestamp 是 Unix 毫秒时间戳 (number)
 */
interface eventWithTime {
    timestamp: number // Unix 毫秒时间戳,例如 1763192168000
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

    // ========== 新增: 录制初始化状态管理 ==========
    private isInitialized = false // 是否已完成初始化(收集到4→2→3)
    private initializationTimeout?: any // 初始化超时定时器
    private readonly INIT_TIMEOUT_MS = 5000 // 初始化超时时间: 5秒
    private baseEvents: {
        meta: eventWithTime | null // Meta事件(type: 4)
        fullSnapshot: eventWithTime | null // FullSnapshot事件(type: 2)
        firstIncremental: eventWithTime | null // 第一个IncrementalSnapshot事件(type: 3)
    } = {
        meta: null,
        fullSnapshot: null,
        firstIncremental: null,
    }

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

            // ========== 新增: 启动初始化超时定时器 ==========
            this.startInitializationTimeout()
        } catch (error) {
            this.isRecording = false
        }
    }

    /**
     * 启动初始化超时定时器
     * 如果5秒内没有收集到4→2→3,强制标记为已初始化并记录警告
     */
    private startInitializationTimeout(): void {
        this.initializationTimeout = window.setTimeout(() => {
            if (!this.isInitialized) {
                // 强制标记为已初始化,允许继续录制
                // 但在flushEvents时会验证并可能不上报
                this.isInitialized = true
            }
        }, this.INIT_TIMEOUT_MS) as any
    }

    /**
     * 检查是否完成初始化
     * 必须收集到 Meta(4) → FullSnapshot(2) → IncrementalSnapshot(3)
     */
    private checkInitialization(): void {
        if (this.isInitialized) return

        const hasMeta = !!this.baseEvents.meta
        const hasFullSnapshot = !!this.baseEvents.fullSnapshot
        const hasFirstIncremental = !!this.baseEvents.firstIncremental

        if (hasMeta && hasFullSnapshot && hasFirstIncremental) {
            this.isInitialized = true

            // 清除初始化超时定时器
            if (this.initializationTimeout) {
                clearTimeout(this.initializationTimeout)
                this.initializationTimeout = undefined
            }
        }
    }

    /**
     * 处理录制事件
     *
     * 管理事件缓冲区：
     * - 初始化阶段: 收集 Meta(4) → FullSnapshot(2) → IncrementalSnapshot(3)
     * - 正常情况: 保存最近 N 秒的事件,超出的会被丢弃
     * - 错误发生后: 不清理缓冲区,继续累积事件,以便收集"错误后10秒"的数据
     * - 优化: 每 5 秒清理一次过期事件,避免频繁清理影响性能
     *
     * @param event - rrweb 录制的事件
     */
    private handleEvent(event: any): void {
        const eventWithTime = event as eventWithTime

        // ========== 初始化阶段: 收集基础事件 4→2→3 ==========
        if (!this.isInitialized) {
            // 收集 Meta 事件 (type: 4)
            if (eventWithTime.type === 4 && !this.baseEvents.meta) {
                this.baseEvents.meta = eventWithTime
            }

            // 收集 FullSnapshot 事件 (type: 2)
            if (eventWithTime.type === 2 && !this.baseEvents.fullSnapshot) {
                this.baseEvents.fullSnapshot = eventWithTime
            }

            // 收集第一个 IncrementalSnapshot 事件 (type: 3)
            if (eventWithTime.type === 3 && !this.baseEvents.firstIncremental) {
                this.baseEvents.firstIncremental = eventWithTime
            }

            // 检查是否完成初始化
            this.checkInitialization()
        }

        // 将事件添加到缓冲区
        this.events.push(eventWithTime)

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
         * 重要：始终保留基础事件 (Meta、FullSnapshot、FirstIncremental)
         */
        const now = Date.now()
        const cleanupInterval = 5000 // 5 秒清理一次

        if (now - this.lastCleanupTime > cleanupInterval) {
            const bufferMs = this.options.bufferDuration * 1000
            const cutoffTime = now - bufferMs

            this.events = this.events.filter(e => {
                // ========== 永久保留基础事件 ==========
                // 保留 Meta 事件 (type: 4)
                if (this.baseEvents.meta && e === this.baseEvents.meta) {
                    return true
                }
                // 保留 FullSnapshot 事件 (type: 2)
                if (this.baseEvents.fullSnapshot && e === this.baseEvents.fullSnapshot) {
                    return true
                }
                // 保留第一个 IncrementalSnapshot 事件 (type: 3)
                if (this.baseEvents.firstIncremental && e === this.baseEvents.firstIncremental) {
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
     * 1. 检查是否已初始化(收集到基础事件),如果没有则忽略
     * 2. 如果没有 replayId，生成新的 replayId
     * 3. 如果已有 replayId（说明在10秒内有多个错误），复用同一个 replayId
     * 4. 重置定时器，延长录制时间
     * 5. afterErrorDuration 后一次性上报完整数据（错误前60秒 + 错误后10秒）
     *
     * 改进：
     * - 多个错误共用同一个 replayId（在10秒内）
     * - 只上报1次 replay 事件
     * - 上报的数据包含所有错误的完整上下文
     */
    private handleError(): void {
        // ========== 关键修复: 检查初始化状态 ==========
        // 如果 rrweb 还没初始化完成(没有收集到 Meta、FullSnapshot),忽略此错误
        // 这样可以避免上报无效的 replay 数据
        if (!this.isInitialized) {
            return
        }

        // 如果没有 replayId，生成新的（第一个错误）
        // 如果已有 replayId，复用（后续错误）
        if (!this.currentReplayId) {
            this.currentReplayId = this.generateReplayId()
        }

        this.errorOccurred = true

        // 如果正在处理错误，清除之前的定时器，重新计时
        // 这样可以确保最后一个错误发生后还能录制10秒
        if (this.errorTimer) {
            clearTimeout(this.errorTimer)
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
                // ========== 核心修复: 只保留基础事件 (前3个) ==========
                // Meta(4)、FullSnapshot(2)、FirstIncremental(3) 只在页面加载时发送一次
                // 必须保留这3个事件,否则下次错误时无法上报
                //
                // 参考 Sentry 实现: buffer 永远保留基础事件
                const baseEventsCount = 3
                this.events = this.events.slice(0, baseEventsCount)
            }
        }, this.options.afterErrorDuration * 1000) as any
    }

    /**
     * 上报录制事件
     *
     * 将缓冲区中的所有事件上报到服务器
     * 创建 type: 'replay' 事件（符合 Sentry 标准）
     *
     * 修复后的逻辑：
     * - 验证并确保基础事件 4→2→3 存在
     * - 重新排序: 基础事件放在最前面
     * - 创建事件快照,用于上报和开发环境查看
     * - 上报快照数据,而不是直接引用 this.events
     * - 保存快照到 lastFlushedEvents,供 getRecordedEvents() 使用
     * - 上报后不清空缓冲区,由调用方决定如何处理
     */
    private flushEvents(): void {
        if (this.events.length === 0) {
            return
        }

        // ========== 验证基础事件 ==========
        const hasMeta = !!this.baseEvents.meta
        const hasFullSnapshot = !!this.baseEvents.fullSnapshot
        const hasFirstIncremental = !!this.baseEvents.firstIncremental

        console.warn('[SessionReplay] flushEvents called:', {
            hasMeta,
            hasFullSnapshot,
            hasFirstIncremental,
            eventsCount: this.events.length,
            isInitialized: this.isInitialized,
            replayId: this.currentReplayId,
        })

        if (!hasMeta || !hasFullSnapshot || !hasFirstIncremental) {
            console.error('[SessionReplay] Missing base events, cannot flush - ABORTING')
            // 不上报不完整的replay数据
            return
        }

        // ========== 重新排序: 确保基础事件在最前面 ==========
        // 1. 移除基础事件(它们会被重新添加到最前面)
        const otherEvents = this.events.filter(
            e => e !== this.baseEvents.meta && e !== this.baseEvents.fullSnapshot && e !== this.baseEvents.firstIncremental
        )

        // 2. 重新组装: 基础事件 + 其他事件
        // 已经在上面验证过这些字段存在,所以可以安全使用!
        const metaEvent = this.baseEvents.meta!
        const fullSnapshotEvent = this.baseEvents.fullSnapshot!
        const firstIncrementalEvent = this.baseEvents.firstIncremental!
        const reorderedEvents = [metaEvent, fullSnapshotEvent, firstIncrementalEvent, ...otherEvents]

        // 3. 验证重排序结果
        if (reorderedEvents[0]?.type !== 4 || reorderedEvents[1]?.type !== 2 || reorderedEvents[2]?.type !== 3) {
            console.error('[SessionReplay] Failed to reorder events correctly:', {
                first3Types: reorderedEvents.slice(0, 3).map(e => e.type),
            })
            return
        }

        // 创建事件快照(使用重排序后的events)
        const eventsSnapshot = [...reorderedEvents]
        const duration = this.calculateDuration()
        const eventCount = eventsSnapshot.length

        // 开发环境：打印上报信息
        const firstEvent = eventsSnapshot[0]
        const lastEvent = eventsSnapshot[eventsSnapshot.length - 1]
        console.warn('[SessionReplay] Flushing events:', {
            replayId: this.currentReplayId,
            eventCount,
            duration,
            first3Types: eventsSnapshot.slice(0, 3).map(e => e.type), // 应该是 [4, 2, 3]
            firstEventTime: firstEvent ? new Date(firstEvent.timestamp).toISOString() : null,
            lastEventTime: lastEvent ? new Date(lastEvent.timestamp).toISOString() : null,
            flushTime: new Date().toISOString(),
        })

        /**
         * 上报录制数据
         * 使用 type: 'replay' 事件类型（不再使用 custom + category）
         * 包含 replayId 用于与错误事件关联
         *
         * 注意: 不需要 timestamp 字段,后端会使用 events[0].timestamp
         */
        const replayEvent = {
            type: 'replay',
            replayId: this.currentReplayId || this.generateReplayId(),
            events: eventsSnapshot, // 使用重排序后的快照
            metadata: {
                eventCount,
                duration,
                compressed: false, // 暂时不压缩，由 Transport 层处理
                originalSize: JSON.stringify(eventsSnapshot).length,
                compressedSize: 0,
            },
            trigger: this.errorOccurred ? 'error' : 'manual',
        }

        console.warn('[SessionReplay] Calling captureEvent with replay data:', {
            replayId: replayEvent.replayId,
            eventCount: eventsSnapshot.length,
            firstEventTime: eventsSnapshot[0]?.timestamp,
            trigger: replayEvent.trigger,
        })

        captureEvent(replayEvent as any)
        console.warn('[SessionReplay] captureEvent called successfully')

        // 保存快照到 lastFlushedEvents (用于开发环境查看)
        this.lastFlushedEvents = eventsSnapshot
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

        if (this.initializationTimeout) {
            clearTimeout(this.initializationTimeout)
            this.initializationTimeout = undefined
        }

        // 清空事件缓冲和基础事件引用
        this.events = []
        this.baseEvents = {
            meta: null,
            fullSnapshot: null,
            firstIncremental: null,
        }
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
