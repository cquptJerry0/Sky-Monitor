/**
 * 会话回放页
 */

import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useSessionReplay } from '@/hooks/useSessionQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react'
import rrwebPlayer from 'rrweb-player'
import 'rrweb-player/dist/style.css'

export default function SessionReplayPage() {
    const { sessionId } = useParams<{ sessionId: string }>()
    const navigate = useNavigate()
    const { currentApp } = useCurrentApp()
    const playerRef = useRef<HTMLDivElement>(null)
    const [player, setPlayer] = useState<any>(null)
    const [isPlaying, setIsPlaying] = useState(false)

    // 查询会话回放数据
    const { data: replayData, isLoading } = useSessionReplay(sessionId || null, currentApp?.appId || '')

    useEffect(() => {
        if (!replayData || !playerRef.current || player) return

        try {
            // 初始化 rrweb-player
            const newPlayer = new rrwebPlayer({
                target: playerRef.current,
                props: {
                    events: replayData.events as any,
                    width: 1024,
                    height: 768,
                    autoPlay: false,
                    showController: true,
                    speedOption: [1, 2, 4, 8],
                },
            })

            setPlayer(newPlayer)

            // 监听播放状态
            newPlayer.addEventListener('ui-update-current-time', () => {
                // 可以在这里更新播放进度
            })

            newPlayer.addEventListener('finish', () => {
                setIsPlaying(false)
            })
        } catch (error) {
            console.error('Failed to initialize rrweb player:', error)
        }

        return () => {
            if (player) {
                player.pause()
            }
        }
    }, [replayData, playerRef.current])

    const handlePlayPause = () => {
        if (!player) return

        if (isPlaying) {
            player.pause()
        } else {
            player.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleRestart = () => {
        if (!player) return
        player.goto(0)
        player.play()
        setIsPlaying(true)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">加载回放数据中...</div>
            </div>
        )
    }

    if (!replayData || !replayData.events || replayData.events.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="text-muted-foreground mb-4">暂无回放数据</div>
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        返回
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* 头部 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        返回
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">会话回放</h1>
                        <p className="text-muted-foreground mt-1">会话 ID: {sessionId}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRestart}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        重新播放
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePlayPause}>
                        {isPlaying ? (
                            <>
                                <Pause className="h-4 w-4 mr-2" />
                                暂停
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                播放
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* 回放信息 */}
            <Card>
                <CardHeader>
                    <CardTitle>回放信息</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">事件数量</div>
                            <div className="mt-1 text-lg font-semibold">{replayData.metadata.eventCount}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">会话时长</div>
                            <div className="mt-1 text-lg font-semibold">
                                {replayData.metadata.duration ? `${(replayData.metadata.duration / 1000).toFixed(1)}s` : '-'}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">会话 ID</div>
                            <div className="mt-1 font-mono text-sm">{replayData.metadata.sessionId || '-'}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">记录时间</div>
                            <div className="mt-1 text-sm">
                                {replayData.metadata.timestamp ? new Date(replayData.metadata.timestamp).toLocaleString('zh-CN') : '-'}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 回放播放器 */}
            <Card>
                <CardHeader>
                    <CardTitle>回放播放器</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center bg-muted/30 rounded-lg p-4">
                        <div ref={playerRef} className="rrweb-player-wrapper" />
                    </div>
                </CardContent>
            </Card>

            {/* 使用说明 */}
            <Card>
                <CardHeader>
                    <CardTitle>使用说明</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>• 点击播放按钮开始回放用户会话</p>
                    <p>• 使用进度条可以快进或后退到指定时间点</p>
                    <p>• 支持 1x、2x、4x、8x 倍速播放</p>
                    <p>• 点击重新播放按钮可以从头开始回放</p>
                </CardContent>
            </Card>
        </div>
    )
}
