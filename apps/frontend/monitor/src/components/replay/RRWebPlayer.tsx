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
    width = 1024,
    height = 768,
    autoPlay = false,
    showController = true,
    onErrorClick,
}: RRWebPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const playerRef = useRef<RRWebPlayerInstance | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(autoPlay)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)

    /**
     * 初始化播放器
     *
     * ## 生命周期管理
     * 1. 清理旧的播放器实例 (避免内存泄漏)
     * 2. 创建新的 rrweb-player 实例
     * 3. 注册事件监听器 (播放状态、当前时间)
     * 4. 计算会话总时长
     * 5. 组件卸载时清理资源
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
            // 清理旧的播放器 DOM
            if (containerRef.current) {
                containerRef.current.innerHTML = ''
            }

            // 创建新的播放器实例
            playerRef.current = new rrwebPlayer({
                target: containerRef.current,
                props: {
                    events, // rrweb 事件数组
                    width, // 播放器宽度
                    height, // 播放器高度
                    autoPlay, // 是否自动播放
                    showController, // 是否显示内置控制器
                    speedOption: [1, 2, 4, 8], // 播放速度选项
                    skipInactive: false, // 不跳过不活跃时间 (保留完整会话)
                    showWarning: true, // 显示警告信息
                },
            })

            // 获取播放器实例
            const player = playerRef.current

            // 监听播放器事件
            if (player && player.on) {
                // 监听当前播放时间变化
                player.on('ui-update-current-time', (payload: PlayerEventPayload) => {
                    setCurrentTime(payload.currentTime || 0)
                })

                // 监听播放状态变化 (playing/paused)
                player.on('ui-update-player-state', (payload: PlayerEventPayload) => {
                    setIsPlaying(payload.state === 'playing')
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
    }, [events, width, height, autoPlay, showController])

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
     * @param errorTimestamp - 错误发生的绝对时间戳 (ISO 字符串)
     * @returns 错误在时间轴上的位置百分比 (0-100)
     *
     * ## 计算公式
     * 1. errorTime = new Date(errorTimestamp).getTime() // 错误的绝对时间
     * 2. startTime = firstEvent.timestamp // 会话开始时间
     * 3. relativeTime = errorTime - startTime // 错误相对于会话开始的时间
     * 4. position = (relativeTime / duration) * 100 // 转换为百分比
     *
     * ## 示例
     * - 会话开始: 10:00:00 (timestamp: 1000)
     * - 会话结束: 10:05:00 (timestamp: 6000)
     * - 错误发生: 10:02:30 (timestamp: 3500)
     * - duration = 6000 - 1000 = 5000ms
     * - relativeTime = 3500 - 1000 = 2500ms
     * - position = (2500 / 5000) * 100 = 50%
     */
    const getErrorPosition = (errorTimestamp: string) => {
        if (events.length === 0) return 0
        const firstEvent = events[0]
        if (!firstEvent) return 0

        const errorTime = new Date(errorTimestamp).getTime()
        const startTime = firstEvent.timestamp
        const relativeTime = errorTime - startTime

        return (relativeTime / duration) * 100
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
        <div className="space-y-4">
            {/* 播放器容器 */}
            <div className="relative rounded-lg border bg-background shadow-sm">
                <div ref={containerRef} className="overflow-hidden rounded-lg" />
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
                                            const errorTime = new Date(error.timestamp).getTime()
                                            const firstEvent = events[0]
                                            if (firstEvent) {
                                                seekTo(errorTime - firstEvent.timestamp)
                                            }
                                        }}
                                        title={`${error.message} - ${formatTime(new Date(error.timestamp).getTime())}`}
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
                                        const errorTime = new Date(error.timestamp).getTime()
                                        const firstEvent = events[0]
                                        if (firstEvent) {
                                            seekTo(errorTime - firstEvent.timestamp)
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
                                                {formatTime(new Date(error.timestamp).getTime())}
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
                                            const errorTime = new Date(error.timestamp).getTime()
                                            const firstEvent = events[0]
                                            if (firstEvent) {
                                                seekTo(errorTime - firstEvent.timestamp)
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
