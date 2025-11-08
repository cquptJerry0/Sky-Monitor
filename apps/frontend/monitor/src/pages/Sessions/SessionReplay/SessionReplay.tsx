import { useQuery } from '@tanstack/react-query'
import { formatDate } from 'date-fns'
import { Play } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import rrwebPlayer from 'rrweb-player'
import 'rrweb-player/dist/style.css'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fetchSessionReplay } from '@/services'

export function SessionReplay() {
    const { sessionId } = useParams<{ sessionId: string }>()
    const playerContainerRef = useRef<HTMLDivElement>(null)
    const playerRef = useRef<any>(null)

    const { data: sessionData, isLoading } = useQuery({
        queryKey: ['sessionReplay', sessionId],
        queryFn: () => fetchSessionReplay(sessionId || ''),
        enabled: !!sessionId,
    })

    const sessionEvents = sessionData?.data?.data || []

    const replayEvents = sessionEvents
        .map((event: any) => {
            try {
                const eventData = typeof event.event_data === 'string' ? JSON.parse(event.event_data) : event.event_data
                if (eventData.category === 'sessionReplay' && eventData.events) {
                    return eventData.events
                }
                return null
            } catch {
                return null
            }
        })
        .filter(Boolean)
        .flat()

    useEffect(() => {
        if (playerContainerRef.current && replayEvents.length > 0 && !playerRef.current) {
            playerRef.current = new rrwebPlayer({
                target: playerContainerRef.current,
                props: {
                    events: replayEvents,
                    width: playerContainerRef.current.clientWidth,
                    height: 600,
                    autoPlay: false,
                    speedOption: [1, 2, 4, 8],
                },
            })
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.$destroy()
                playerRef.current = null
            }
        }
    }, [replayEvents])

    if (isLoading) {
        return (
            <div className="flex-1 flex-col">
                <header className="flex items-center justify-between h-[36px] mb-4">
                    <h1 className="flex flex-row items-center text-xl font-semibold">
                        <Play className="h-6 w-6 mr-2" />
                        会话回放
                    </h1>
                </header>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
                            <p className="text-muted-foreground">加载中...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex-1 flex-col">
            <header className="flex items-center justify-between h-[36px] mb-4">
                <h1 className="flex flex-row items-center text-xl font-semibold">
                    <Play className="h-6 w-6 mr-2" />
                    会话回放
                </h1>
            </header>

            <div className="grid gap-4 mb-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Session ID</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-mono">{sessionId}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>事件数量</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sessionEvents.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>录制片段</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{replayEvents.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>回放播放器</CardTitle>
                    <CardDescription>使用播放控制按钮查看用户会话录制</CardDescription>
                </CardHeader>
                <CardContent>
                    {replayEvents.length === 0 ? (
                        <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
                            <p className="text-muted-foreground">该会话没有录制数据</p>
                        </div>
                    ) : (
                        <div ref={playerContainerRef} className="w-full" />
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>会话事件列表</CardTitle>
                    <CardDescription>该会话的所有事件记录</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>事件类型</TableHead>
                                <TableHead>事件名称</TableHead>
                                <TableHead>时间</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessionEvents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-4">
                                        暂无事件数据
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sessionEvents.slice(0, 50).map((event: any) => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            <Badge variant="outline">{event.event_type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{event.event_name || '-'}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {formatDate(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
