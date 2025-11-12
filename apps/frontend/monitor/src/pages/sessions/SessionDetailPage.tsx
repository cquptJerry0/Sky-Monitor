/**
 * 会话详情页
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useSessionEvents } from '@/hooks/useEventQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EVENT_TYPE_LABELS } from '@/utils/constants'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ArrowLeft, Play, Clock } from 'lucide-react'
import type { EventType } from '@/api/types'

export default function SessionDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { currentApp } = useCurrentApp()
    const { data: events, isLoading } = useSessionEvents(id || null, currentApp?.appId || null)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">加载中...</div>
            </div>
        )
    }

    if (!events || events.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">会话不存在或无事件</div>
            </div>
        )
    }

    const firstEvent = events[0]
    const lastEvent = events[events.length - 1]

    if (!firstEvent || !lastEvent) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">会话数据不完整</div>
            </div>
        )
    }
    const duration = new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime()

    const getEventTypeBadge = (type: EventType) => {
        const colors: Record<string, string> = {
            error: 'destructive',
            httpError: 'destructive',
            resourceError: 'destructive',
            performance: 'default',
            webVital: 'secondary',
            session: 'outline',
        }
        return <Badge variant={colors[type] as any}>{EVENT_TYPE_LABELS[type] || type}</Badge>
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
                        <h1 className="text-2xl font-bold">会话详情</h1>
                        <p className="text-muted-foreground mt-1">会话 ID: {id}</p>
                    </div>
                </div>
                <Button onClick={() => navigate(`/sessions/${id}/replay`)}>
                    <Play className="h-4 w-4 mr-2" />
                    查看回放
                </Button>
            </div>

            {/* 会话信息 */}
            <Card>
                <CardHeader>
                    <CardTitle>会话信息</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">用户 ID</div>
                            <div className="mt-1 font-mono text-sm">{firstEvent.user_id || '-'}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">事件数</div>
                            <div className="mt-1 text-lg font-semibold">{events.length}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">持续时间</div>
                            <div className="mt-1 flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span className="text-lg font-semibold">{(duration / 1000).toFixed(1)}s</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">开始时间</div>
                            <div className="mt-1 text-sm">
                                {format(new Date(firstEvent.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                            </div>
                        </div>
                    </div>

                    {firstEvent.browser && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">浏览器</div>
                                <div className="mt-1">
                                    {firstEvent.browser} {firstEvent.browser_version}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">操作系统</div>
                                <div className="mt-1">
                                    {firstEvent.os} {firstEvent.os_version}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">设备类型</div>
                                <div className="mt-1">{firstEvent.device_type || '-'}</div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 事件时间线 */}
            <Card>
                <CardHeader>
                    <CardTitle>事件时间线</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {events.map((event: any, index: number) => {
                            const relativeTime =
                                index === 0 ? 0 : new Date(event.timestamp).getTime() - new Date(firstEvent.timestamp).getTime()
                            return (
                                <div key={event.id} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/50">
                                    <div className="flex-shrink-0 w-16 text-sm text-muted-foreground">
                                        +{(relativeTime / 1000).toFixed(1)}s
                                    </div>
                                    <div className="flex-shrink-0">{getEventTypeBadge(event.event_type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">
                                            {event.error_message || event.performance_metric || event.web_vital_name || '会话事件'}
                                        </div>
                                        {event.url && (
                                            <div className="text-sm text-muted-foreground font-mono truncate mt-1">{event.url}</div>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0 text-sm text-muted-foreground">
                                        {format(new Date(event.timestamp), 'HH:mm:ss', { locale: zhCN })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* 统计信息 */}
            <Card>
                <CardHeader>
                    <CardTitle>事件统计</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">错误事件</div>
                            <div className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--destructive))' }}>
                                {
                                    events.filter(
                                        (e: any) =>
                                            e.event_type === 'error' || e.event_type === 'httpError' || e.event_type === 'resourceError'
                                    ).length
                                }
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">性能事件</div>
                            <div className="text-2xl font-bold mt-1">
                                {events.filter((e: any) => e.event_type === 'performance').length}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Web Vitals</div>
                            <div className="text-2xl font-bold mt-1">{events.filter((e: any) => e.event_type === 'webVital').length}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">会话事件</div>
                            <div className="text-2xl font-bold mt-1">{events.filter((e: any) => e.event_type === 'session').length}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
