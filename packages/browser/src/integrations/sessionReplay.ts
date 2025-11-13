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
    private isRecording = false
    private errorOccurred = false
    private errorTimer?: any
    private currentReplayId: string | null = null

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
    }

    /**
     * 生成唯一的 Replay ID
     */
    private generateReplayId(): string {
        return `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
                    // 鼠标移动采样（降低事件数量）
                    mousemove: true,
                    mouseInteraction: true,
                },
                // Canvas 录制（可选）
                recordCanvas: this.options.recordCanvas,
                // 跨域 iframe 录制（可选）
                recordCrossOriginIframes: this.options.recordCrossOriginIframes,
            })
        } catch (error) {
            // Silent handling - rrweb initialization failed
            this.isRecording = false
        }
    }

    /**
     * 处理录制事件
     *
     * 管理事件缓冲区：
     * - 保存最近 N 秒的事件
     * - 超出缓冲时长的事件会被丢弃
     * - 错误发生时上报所有缓冲事件
     *
     * @param event - rrweb 录制的事件
     */
    private handleEvent(event: any): void {
        this.events.push(event as eventWithTime)

        /**
         * 清理过期事件
         * 只保留 bufferDuration 时间内的事件
         */
        const now = Date.now()
        const bufferMs = this.options.bufferDuration * 1000

        this.events = this.events.filter(e => {
            return now - e.timestamp < bufferMs
        })

        /**
         * onError 模式下，如果发生了错误，立即上报
         */
        if (this.errorOccurred) {
            // 批量上报事件
            if (this.events.length >= this.options.maxEvents) {
                this.flushEvents()
            }
        }
    }

    /**
     * 监听错误事件
     *
     * 在错误发生时：
     * 1. 标记错误已发生
     * 2. 上报缓冲区中的所有事件
     * 3. 继续录制 afterErrorDuration 时长
     * 4. 停止录制
     */
    private listenForErrors(): void {
        /**
         * 监听全局错误
         */
        window.addEventListener('error', () => {
            this.handleError()
        })

        /**
         * 监听未处理的 Promise 拒绝
         */
        window.addEventListener('unhandledrejection', () => {
            this.handleError()
        })
    }

    /**
     * 处理错误事件
     *
     * 执行流程：
     * 1. 生成唯一的 replayId
     * 2. 立即上报当前缓冲区的所有事件（包含 replayId）
     * 3. 设置定时器，在 afterErrorDuration 后继续上报并重置状态
     *
     * 改进：允许多次触发 Replay，每次错误都生成新的 replayId
     */
    private handleError(): void {
        // 如果正在处理错误，清除之前的定时器
        if (this.errorTimer) {
            clearTimeout(this.errorTimer)
        }

        // 生成唯一的 Replay ID（每次错误都生成新的）
        this.currentReplayId = this.generateReplayId()
        this.errorOccurred = true

        // 立即上报所有缓冲事件
        this.flushEvents()

        /**
         * 继续录制一段时间后停止
         * 这样可以捕获错误发生后的操作
         */
        this.errorTimer = window.setTimeout(() => {
            // 最后一次上报
            this.flushEvents()

            // 如果是 onError 模式，错误后停止录制
            if (this.options.mode === 'onError') {
                this.stopRecordingSession()
            }

            // 重置错误标记和 replayId，允许下次错误再次录制
            this.errorOccurred = false
            this.currentReplayId = null
        }, this.options.afterErrorDuration * 1000) as any
    }

    /**
     * 上报录制事件
     *
     * 将缓冲区中的所有事件上报到服务器
     * 创建 type: 'replay' 事件（符合 Sentry 标准）
     * 上报后清空缓冲区
     */
    private flushEvents(): void {
        if (this.events.length === 0) return

        const duration = this.calculateDuration()
        const eventCount = this.events.length

        /**
         * 上报录制数据
         * 使用 type: 'replay' 事件类型（不再使用 custom + category）
         * 包含 replayId 用于与错误事件关联
         */
        captureEvent({
            type: 'replay',
            replayId: this.currentReplayId || this.generateReplayId(),
            events: this.events, // rrweb 事件数组
            metadata: {
                eventCount,
                duration,
                compressed: false, // 暂时不压缩，由 Transport 层处理
                originalSize: JSON.stringify(this.events).length,
                compressedSize: 0,
            },
            trigger: this.errorOccurred ? 'error' : 'manual',
            timestamp: getChinaTimestamp(),
        } as any)

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
}
