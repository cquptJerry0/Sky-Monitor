import { useEffect, useRef, useState } from 'react'
import rrwebPlayer from 'rrweb-player'
import 'rrweb-player/dist/style.css'
import { AlertCircle, Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RelatedError, EventWithTime, RRWebPlayerInstance, PlayerEventPayload } from '@/types'

interface RRWebPlayerProps {
    events: EventWithTime[]
    relatedErrors?: RelatedError[]
    width?: number
    height?: number
    autoPlay?: boolean
    showController?: boolean
    onErrorClick?: (error: RelatedError) => void
}

/**
 * RRWeb 播放器组件
 *
 * ## 核心功能
 * 1. **会话回放**: 使用 rrweb-player 播放用户会话录制
 * 2. **错误关联**: 显示会话中发生的所有错误，支持点击跳转到错误发生时刻
 * 3. **时间轴可视化**: 在时间轴上标记错误发生的位置
 * 4. **播放控制**: 支持播放/暂停、快进/快退、跳转到指定时间点
 *
 * ## 数据流
 * 1. 接收 rrweb 事件数组 (EventWithTime[])
 * 2. 初始化 rrweb-player 实例
 * 3. 监听播放器状态变化 (播放/暂停、当前时间)
 * 4. 计算错误在时间轴上的相对位置
 * 5. 响应用户交互 (点击错误跳转、播放控制)
 *
 * ## 关键逻辑
 * - **时间计算**: 所有时间都是相对于第一个事件的时间戳
 * - **错误定位**: 通过 (errorTime - firstEventTime) 计算相对时间，再除以总时长得到百分比位置
 * - **播放器生命周期**: 每次 events 变化时重新创建播放器实例，避免状态不一致
 *
 * @param events - rrweb 事件数组，包含完整的 DOM 快照和用户交互记录
 * @param relatedErrors - 会话中发生的所有错误列表
 * @param width - 播放器宽度 (默认 1024px)
 * @param height - 播放器高度 (默认 768px)
 * @param autoPlay - 是否自动播放 (默认 false)
 * @param showController - 是否显示 rrweb 内置控制器 (默认 true)
 * @param onErrorClick - 点击错误时的回调函数
 */
export function RRWebPlayer({
    events,
    relatedErrors = [],
    width,
    height,
    autoPlay = false,
    showController = true,
    onErrorClick,
}: RRWebPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const playerRef = useRef<RRWebPlayerInstance | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(autoPlay)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [playerSize, setPlayerSize] = useState({ width: width || 1024, height: height || 768 })

    /**
     * 验证 rrweb 事件是否有效
     *
     * rrweb 回放器需要:
     * - Type 4 (Meta): 页面元数据 (URL, 宽高)
     * - Type 2 (FullSnapshot): 完整的 DOM 快照
     */
    const validateEvents = (events: EventWithTime[]): { valid: boolean; message?: string } => {
        if (!events || events.length === 0) {
            return { valid: false, message: 'Replay 数据为空' }
        }

        if (events.length < 3) {
            return { valid: false, message: 'Replay 数据不完整 (事件数量过少)' }
        }

        // 检查是否有 Meta 事件 (type: 4)
        const hasMeta = events.some(e => e.type === 4)
        if (!hasMeta) {
            return { valid: false, message: 'Replay 数据缺少 Meta 事件 (type: 4)' }
        }

        // 检查是否有 FullSnapshot 事件 (type: 2)
        const hasFullSnapshot = events.some(e => e.type === 2)
        if (!hasFullSnapshot) {
            return { valid: false, message: 'Replay 数据缺少 FullSnapshot 事件 (type: 2)' }
        }

        return { valid: true }
    }

    /**
     * 计算播放器尺寸 - 响应式适配容器
     */
    useEffect(() => {
        if (!wrapperRef.current) return

        const updateSize = () => {
            if (wrapperRef.current) {
                const containerWidth = wrapperRef.current.clientWidth
                // 如果指定了固定宽度，使用固定宽度；否则使用容器宽度
                const playerWidth = width || Math.min(containerWidth - 32, 1200)
                // 保持 4:3 的宽高比
                const playerHeight = height || Math.floor(playerWidth * 0.75)

                setPlayerSize({ width: playerWidth, height: playerHeight })
            }
        }

        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [width, height])

    /**
     * 初始化播放器
     *
     * ## 生命周期管理
     * 1. 验证 rrweb 事件是否有效 (必须包含 Meta 和 FullSnapshot)
     * 2. 清理旧的播放器实例 (避免内存泄漏)
     * 3. 创建新的 rrweb-player 实例
     * 4. 注册事件监听器 (播放状态、当前时间)
     * 5. 计算会话总时长
     * 6. 组件卸载时清理资源
     *
     * ## 为什么每次都重新创建播放器?
     * - rrweb-player 不支持动态更新 events
     * - 重新创建可以确保播放器状态与 props 一致
     * - 避免旧事件残留导致的播放错误
     *
     * ## 时长计算
     * duration = lastEvent.timestamp - firstEvent.timestamp
     * 所有时间都是相对于第一个事件的时间戳
     */
    useEffect(() => {
        if (!containerRef.current || events.length === 0) return

        try {
            // 验证 rrweb 事件
            const validation = validateEvents(events)
            if (!validation.valid) {
                setError(validation.message || 'Replay 数据无效')
                return
            }

            // 清理旧的播放器 DOM
            if (containerRef.current) {
                containerRef.current.innerHTML = ''
            }

            // 创建新的播放器实例
            const player = new rrwebPlayer({
                target: containerRef.current,
                props: {
                    events: events as any, // rrweb 事件数组
                    width: playerSize.width, // 播放器宽度
                    height: playerSize.height, // 播放器高度
                    autoPlay, // 是否自动播放
                    showController, // 是否显示内置控制器
                    speedOption: [1, 2, 4, 8], // 播放速度选项
                    skipInactive: false, // 不跳过不活跃时间 (保留完整会话)
                    showWarning: true, // 显示警告信息
                },
            }) as any

            playerRef.current = player

            // 监听播放器事件
            if (player && player.on) {
                // 监听当前播放时间变化
                player.on('ui-update-current-time', (payload: unknown) => {
                    const p = payload as PlayerEventPayload
                    setCurrentTime(p.currentTime || 0)
                })

                // 监听播放状态变化 (playing/paused)
                player.on('ui-update-player-state', (payload: unknown) => {
                    const p = payload as PlayerEventPayload
                    setIsPlaying(p.state === 'playing')
                })
            }

            // 计算会话总时长 (最后一个事件 - 第一个事件)
            if (events.length > 0) {
                const firstEvent = events[0]
                const lastEvent = events[events.length - 1]
                if (firstEvent && lastEvent) {
                    setDuration(lastEvent.timestamp - firstEvent.timestamp)
                }
            }

            setError(null)
        } catch (err) {
            console.error('[RRWebPlayer] Error:', err)
            setError(`播放器初始化失败: ${err instanceof Error ? err.message : String(err)}`)
        }

        // 清理函数: 组件卸载或 events 变化时执行
        return () => {
            const container = containerRef.current
            if (container) {
                container.innerHTML = '' // 清理 DOM
            }
            playerRef.current = null // 释放播放器引用
        }
    }, [events, playerSize.width, playerSize.height, autoPlay, showController])

    /**
     * 跳转到指定时间点
     *
     * @param timestamp - 相对于第一个事件的时间偏移量 (毫秒)
     *
     * ## 使用场景
     * - 点击错误列表跳转到错误发生时刻
     * - 点击时间轴标记跳转
     * - 快进/快退按钮
     */
    const seekTo = (timestamp: number) => {
        if (playerRef.current && playerRef.current.goto) {
            playerRef.current.goto(timestamp)
        }
    }

    /**
     * 切换播放/暂停状态
     *
     * ## 实现方式
     * - 调用 rrweb-player 的 play() 和 pause() 方法
     * - 播放器会触发 'ui-update-player-state' 事件更新 isPlaying 状态
     */
    const togglePlay = () => {
        if (playerRef.current) {
            if (isPlaying) {
                playerRef.current.pause()
            } else {
                playerRef.current.play()
            }
        }
    }

    /**
     * 格式化时间显示
     *
     * @param ms - 毫秒数
     * @returns 格式化后的时间字符串 (例如: "1:23")
     */
    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    /**
     * 计算错误在时间轴上的位置百分比
     *
     * @param errorTimestamp - 错误发生的绝对时间戳 (Unix 毫秒时间戳,number 或 string)
     * @returns 错误在时间轴上的位置百分比 (0-100)
     *
     * ## 数据流说明
     * 1. SDK: rrweb 事件的 timestamp 是 Unix 毫秒时间戳 (number)
     * 2. Backend: 错误事件的 timestamp 也转换为 Unix 毫秒时间戳 (number)
     * 3. Frontend: 直接使用数字进行计算,无需字符串解析
     *
     * ## 计算公式
     * 1. errorTime = Number(errorTimestamp) // 错误的绝对时间 (Unix ms)
     * 2. startTime = firstEvent.timestamp // 会话开始时间 (Unix ms)
     * 3. relativeTime = errorTime - startTime // 错误相对于会话开始的时间
     * 4. position = (relativeTime / duration) * 100 // 转换为百分比
     *
     * ## 示例
     * - 会话开始: 1763157539882 (rrweb 第一个事件)
     * - 会话结束: 1763157553882 (rrweb 最后一个事件)
     * - 错误发生: 1763157546882 (错误事件)
     * - duration = 1763157553882 - 1763157539882 = 14000ms
     * - relativeTime = 1763157546882 - 1763157539882 = 7000ms
     * - position = (7000 / 14000) * 100 = 50%
     */
    const getErrorPosition = (errorTimestamp: string | number) => {
        if (events.length === 0 || duration === 0) return 0
        const firstEvent = events[0]
        if (!firstEvent) return 0

        const errorTime = Number(errorTimestamp)
        const startTime = firstEvent.timestamp
        const relativeTime = errorTime - startTime

        // 确保位置在 0-100 之间
        const position = (relativeTime / duration) * 100
        return Math.max(0, Math.min(100, position))
    }

    if (error) {
        return (
            <Card className="border-destructive">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        <p className="font-semibold">错误</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4" ref={wrapperRef}>
            {/* 播放器容器 */}
            <div className="relative rounded-lg border bg-background shadow-sm">
                <div
                    ref={containerRef}
                    className="overflow-hidden rounded-lg w-full flex items-center justify-center"
                    style={{ minHeight: `${playerSize.height}px` }}
                />
            </div>

            {/* 关联错误列表 */}
            {relatedErrors.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            关联错误 ({relatedErrors.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* 错误时间轴 */}
                        <div className="relative mb-4 h-2 rounded-full bg-muted">
                            {relatedErrors.map((error, index) => {
                                const position = getErrorPosition(error.timestamp)
                                return (
                                    <div
                                        key={error.id}
                                        className="absolute top-0 h-2 w-1 cursor-pointer bg-destructive transition-all hover:h-3 hover:-translate-y-0.5"
                                        style={{ left: `${position}%` }}
                                        onClick={() => {
                                            const errorTime = Number(error.timestamp)
                                            const firstEvent = events[0]
                                            if (firstEvent) {
                                                const relativeTime = errorTime - firstEvent.timestamp
                                                console.log('[RRWebPlayer] 跳转到错误时间:', {
                                                    errorTimestamp: error.timestamp,
                                                    errorTime,
                                                    firstEventTime: firstEvent.timestamp,
                                                    relativeTime,
                                                    duration,
                                                    position: `${position}%`,
                                                })
                                                seekTo(relativeTime)
                                            }
                                        }}
                                        title={`${error.message} - ${new Date(Number(error.timestamp)).toLocaleString()}`}
                                    />
                                )
                            })}
                        </div>

                        {/* 错误列表 */}
                        <div className="space-y-2">
                            {relatedErrors.map((error, index) => (
                                <div
                                    key={error.id}
                                    className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                                    onClick={() => {
                                        const errorTime = Number(error.timestamp)
                                        const firstEvent = events[0]
                                        if (firstEvent) {
                                            const relativeTime = errorTime - firstEvent.timestamp
                                            console.log('[RRWebPlayer] 点击错误跳转:', {
                                                errorTimestamp: error.timestamp,
                                                errorTime,
                                                firstEventTime: firstEvent.timestamp,
                                                relativeTime,
                                                duration,
                                            })
                                            seekTo(relativeTime)
                                        }
                                        onErrorClick?.(error)
                                    }}
                                >
                                    <Badge variant="destructive" className="mt-0.5 shrink-0">
                                        {index + 1}
                                    </Badge>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{error.errorType}</Badge>
                                            <span className="text-xs text-muted-foreground">
                                                <Clock className="mr-1 inline h-3 w-3" />
                                                {new Date(Number(error.timestamp)).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium">{error.message}</p>
                                        {error.path && (
                                            <p className="text-xs text-muted-foreground">
                                                {error.path}
                                                {error.lineno && `:${error.lineno}`}
                                                {error.colno && `:${error.colno}`}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={e => {
                                            e.stopPropagation()
                                            const errorTime = Number(error.timestamp)
                                            const firstEvent = events[0]
                                            if (firstEvent) {
                                                const relativeTime = errorTime - firstEvent.timestamp
                                                seekTo(relativeTime)
                                            }
                                        }}
                                    >
                                        跳转
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 自定义控制栏 */}
            {!showController && (
                <div className="flex items-center gap-2 rounded-lg border bg-background p-3">
                    <Button variant="outline" size="icon" onClick={togglePlay}>
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => seekTo(Math.max(0, currentTime - 5000))}>
                        <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => seekTo(Math.min(duration, currentTime + 5000))}>
                        <SkipForward className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center text-sm text-muted-foreground">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                </div>
            )}
        </div>
    )
}
