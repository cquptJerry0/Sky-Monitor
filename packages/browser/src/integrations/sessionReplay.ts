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
     * 错误前保留时长（秒）
     * 保存错误发生前 N 秒的录制数据
     * 默认 60 秒
     */
    beforeErrorDuration?: number

    /**
     * 错误后继续录制时长（秒）
     * 错误发生后继续录制的时间
     * 默认 10 秒
     */
    afterErrorDuration?: number

    /**
     * Checkout 间隔（毫秒）
     * 每隔 N 毫秒生成一次新的 FullSnapshot
     * 用于确保 DOM 快照的新鲜度,解决 SPA 路由跳转等场景
     * 默认 30000 (30 秒)
     */
    checkoutEveryNms?: number

    /**
     * 最大事件段数量
     * 限制 eventsMatrix 的最大长度,控制内存占用
     * 默认 3 (保留最近 90 秒历史)
     */
    maxSegments?: number

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

    // ========== 核心改进: 使用二维数组存储事件段 ==========
    // 每个段包含: Meta + FullSnapshot + IncrementalSnapshots
    // checkoutEveryNms 触发时会创建新段
    private eventsMatrix: eventWithTime[][] = [[]]

    private lastFlushedEvents: eventWithTime[] = []
    private isRecording = false
    private errorOccurred = false
    private errorTimer?: any
    private currentReplayId: string | null = null

    // ========== 录制初始化状态管理 ==========
    private isInitialized = false
    private initializationTimeout?: any
    private readonly INIT_TIMEOUT_MS = 5000
    private hasMetaEvent = false
    private hasFullSnapshot = false
    private hasFirstIncrementalSnapshot = false

    // 全局静态变量: 防止多个实例重复注册事件监听器
    private static globalInstance: SessionReplayIntegration | null = null
    private static lastErrorTime = 0
    private static errorDebounceMs = 100

    constructor(options: SessionReplayOptions = {}) {
        this.options = {
            mode: options.mode ?? 'onError',
            sampleRate: options.sampleRate ?? 0.1,
            beforeErrorDuration: options.beforeErrorDuration ?? 60,
            afterErrorDuration: options.afterErrorDuration ?? 10,
            checkoutEveryNms: options.checkoutEveryNms ?? 30000,
            maxSegments: options.maxSegments ?? 3,
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
     * 配置隐私脱敏、性能优化、checkoutEveryNms 等选项
     */
    private startRecording(): void {
        if (this.isRecording) return

        this.isRecording = true

        try {
            /**
             * 启动 rrweb 录制
             * emit 回调会在每次 DOM 变化时被调用
             * isCheckout 参数标识是否是 checkout 事件
             */
            this.stopRecording = record({
                emit: (event, isCheckout) => {
                    this.handleEvent(event, isCheckout)
                },

                // ========== 核心配置: checkoutEveryNms ==========
                // 每隔 N 毫秒生成一次新的 FullSnapshot
                // 确保 DOM 快照的新鲜度,解决 SPA 路由跳转等场景
                checkoutEveryNms: this.options.checkoutEveryNms,

                // 隐私保护配置
                maskAllInputs: this.options.maskAllInputs,
                maskTextClass: this.options.maskTextClass,
                blockClass: this.options.blockClass,
                ignoreClass: this.options.ignoreClass,

                // 性能优化配置
                sampling: {
                    mousemove: 50,
                    mouseInteraction: false,
                    scroll: 150,
                    input: 'last',
                },

                recordCanvas: this.options.recordCanvas,
                recordCrossOriginIframes: this.options.recordCrossOriginIframes,
            })

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
     * 清除初始化超时定时器
     */
    private clearInitializationTimeout(): void {
        if (this.initializationTimeout) {
            clearTimeout(this.initializationTimeout)
            this.initializationTimeout = undefined
        }
    }

    /**
     * 获取当前活跃的事件段
     */
    private get currentSegment(): eventWithTime[] {
        const segment = this.eventsMatrix[this.eventsMatrix.length - 1]
        if (!segment) {
            this.eventsMatrix.push([])
            return this.eventsMatrix[0]!
        }
        return segment
    }

    /**
     * 处理录制事件
     *
     * 核心改进:
     * - 支持 isCheckout 参数,当 checkoutEveryNms 触发时创建新事件段
     * - 使用二维数组 eventsMatrix 存储多个事件段
     * - 每个段都包含完整的 Meta + FullSnapshot + Incrementals
     * - 自动清理过旧的段,控制内存占用
     *
     * @param event - rrweb 录制的事件
     * @param isCheckout - 是否是 checkout 事件(由 rrweb 传入)
     */
    private handleEvent(event: any, isCheckout?: boolean): void {
        const eventWithTime = event as eventWithTime

        // ========== Checkout 处理: 创建新事件段 ==========
        if (isCheckout) {
            // 创建新的事件段
            this.eventsMatrix.push([])

            // 清理过旧的段,只保留最近的 maxSegments 段
            if (this.eventsMatrix.length > this.options.maxSegments) {
                this.eventsMatrix.shift()
            }
        }

        // 将事件添加到当前段
        this.currentSegment.push(eventWithTime)

        // ========== 基础事件标记 ==========
        // 用于验证事件链完整性
        if (eventWithTime.type === 4) {
            // Meta 事件
            this.hasMetaEvent = true
        } else if (eventWithTime.type === 2) {
            // FullSnapshot 事件
            this.hasFullSnapshot = true
        } else if (eventWithTime.type === 3 && !this.hasFirstIncrementalSnapshot) {
            // 第一个 IncrementalSnapshot 事件
            this.hasFirstIncrementalSnapshot = true
        }

        // ========== 初始化完成检测 ==========
        if (this.hasMetaEvent && this.hasFullSnapshot && this.hasFirstIncrementalSnapshot) {
            if (!this.isInitialized) {
                this.isInitialized = true
                this.clearInitializationTimeout()
            }
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

            // ========== 核心改进: 不清空缓冲区 ==========
            // 保留所有事件段,让 checkoutEveryNms 和 maxSegments 自动管理
            // 每次错误都能获取到最新的 FullSnapshot
        }, this.options.afterErrorDuration * 1000) as any
    }

    /**
     * 上报录制事件
     *
     * 核心改进:
     * - 合并最近的事件段(eventsMatrix)
     * - 验证事件链完整性
     * - 时间过滤: 只保留错误前 N 秒的事件
     * - 确保每次上报都有最新的 FullSnapshot
     */
    private flushEvents(): void {
        if (this.eventsMatrix.length === 0) {
            return
        }

        // ========== 合并最近的事件段 ==========
        let eventsToSend: eventWithTime[] = []

        if (this.eventsMatrix.length === 1) {
            // 只有一个段,直接使用
            const segment = this.eventsMatrix[0]
            if (!segment) {
                console.error('[SessionReplay] 事件段为空')
                return
            }
            eventsToSend = segment
        } else {
            // 多个段,合并最近的两个段
            const len = this.eventsMatrix.length
            const segment1 = this.eventsMatrix[len - 2]
            const segment2 = this.eventsMatrix[len - 1]

            if (!segment1 || !segment2) {
                console.error('[SessionReplay] 事件段不存在')
                return
            }

            eventsToSend = segment1.concat(segment2)
        }

        // ========== 验证事件链完整性 ==========
        const hasMeta = eventsToSend.some(e => e.type === 4)
        const hasFullSnapshot = eventsToSend.some(e => e.type === 2)
        const hasIncremental = eventsToSend.some(e => e.type === 3)

        if (!hasMeta || !hasFullSnapshot) {
            console.error('[SessionReplay] 事件链不完整,缺少基础事件', {
                hasMeta,
                hasFullSnapshot,
                hasIncremental,
                eventCount: eventsToSend.length,
                segmentCount: this.eventsMatrix.length,
            })
            return
        }

        // ========== 时间过滤: 只保留错误前 N 秒的事件 ==========
        const errorTime = Date.now()
        const startTime = errorTime - this.options.beforeErrorDuration * 1000

        // 找到最后一个 FullSnapshot 的位置
        let lastFullSnapshotIndex = -1
        for (let i = eventsToSend.length - 1; i >= 0; i--) {
            const event = eventsToSend[i]
            if (event && event.type === 2) {
                lastFullSnapshotIndex = i
                break
            }
        }

        // 保留: 最后一个 FullSnapshot + 之后时间范围内的事件
        const filteredEvents = eventsToSend.filter((event, index) => {
            // 保留最后一个 FullSnapshot 及之前的 Meta 事件
            if (index <= lastFullSnapshotIndex) {
                return event.type === 4 || event.type === 2
            }
            // 保留时间范围内的增量事件
            return event.timestamp >= startTime
        })

        // 验证过滤后的事件
        if (filteredEvents.length === 0) {
            console.error('[SessionReplay] 过滤后没有事件')
            return
        }

        const duration = this.calculateDuration(filteredEvents)
        const eventCount = filteredEvents.length

        console.warn('[SessionReplay] 准备上报事件', {
            replayId: this.currentReplayId,
            totalSegments: this.eventsMatrix.length,
            mergedEvents: eventsToSend.length,
            filteredEvents: eventCount,
            duration,
            timeRange: `${new Date(startTime).toISOString()} ~ ${new Date(errorTime).toISOString()}`,
            first3Types: filteredEvents.slice(0, 3).map(e => e.type),
        })

        /**
         * 上报录制数据
         */
        const replayEvent = {
            type: 'replay',
            replayId: this.currentReplayId || this.generateReplayId(),
            events: filteredEvents,
            metadata: {
                eventCount,
                duration,
                compressed: false,
                originalSize: JSON.stringify(filteredEvents).length,
                compressedSize: 0,
            },
            trigger: this.errorOccurred ? 'error' : 'manual',
        }

        console.warn('[SessionReplay] 上报 replay 数据:', {
            replayId: replayEvent.replayId,
            eventCount,
            trigger: replayEvent.trigger,
        })

        captureEvent(replayEvent as any)

        // 保存快照到 lastFlushedEvents (用于开发环境查看)
        this.lastFlushedEvents = filteredEvents
    }

    /**
     * 计算录制时长
     *
     * @param events - 事件数组
     * @returns 录制时长（秒）
     */
    private calculateDuration(events: eventWithTime[]): number {
        if (events.length === 0) return 0

        const firstEvent = events[0]
        const lastEvent = events[events.length - 1]

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

        // 清空事件缓冲
        this.eventsMatrix = [[]]
        this.hasMetaEvent = false
        this.hasFullSnapshot = false
        this.hasFirstIncrementalSnapshot = false
    }

    /**
     * 获取录制的事件(仅用于开发环境)
     * 用于在开发时查看录制的内容
     *
     * @returns 录制的 rrweb events
     */
    getRecordedEvents(): eventWithTime[] {
        // 优先返回最后一次上报的完整录像
        if (this.lastFlushedEvents.length > 0) {
            return [...this.lastFlushedEvents]
        }
        // 如果还没上报,返回当前正在录制的数据(合并所有段)
        return this.eventsMatrix.flat()
    }

    /**
     * 获取当前录制状态(仅用于开发环境)
     *
     * @returns 录制状态信息
     */
    getRecordingStatus() {
        const allEvents = this.eventsMatrix.flat()
        return {
            isRecording: this.isRecording,
            errorOccurred: this.errorOccurred,
            eventsCount: allEvents.length,
            segmentCount: this.eventsMatrix.length,
            replayId: this.currentReplayId,
            duration: this.calculateDuration(allEvents),
        }
    }
}
