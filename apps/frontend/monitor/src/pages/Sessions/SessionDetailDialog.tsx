import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Users, Clock, Activity, Monitor } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SessionEvent } from '@/types/api'
import * as sessionService from '@/services/sessions'

interface SessionDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    session: SessionEvent
}

export function SessionDetailDialog({ open, onOpenChange, session }: SessionDetailDialogProps) {
    const { data: detailData } = useQuery({
        queryKey: ['session-detail', session.session_id],
        queryFn: () => sessionService.fetchSessionDetail(session.session_id),
        enabled: open,
    })

    const detail = detailData?.data
    const events = detail?.events || []

    const formatDuration = (ms?: number) => {
        if (!ms) return '-'
        if (ms < 60000) return `${Math.floor(ms / 1000)}秒`
        return `${Math.floor(ms / 60000)}分${Math.floor((ms % 60000) / 1000)}秒`
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        会话详情
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">会话信息</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">会话 ID</p>
                                    <p className="text-xs font-mono bg-muted p-2 rounded break-all">{session.session_id}</p>
                                </div>
                                {session.user_id && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">用户 ID</p>
                                        <p className="text-xs font-mono bg-muted p-2 rounded break-all">{session.user_id}</p>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">开始时间</p>
                                    <p className="text-sm">{format(new Date(session.start_time), 'yyyy-MM-dd HH:mm:ss')}</p>
                                </div>
                                {session.end_time && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">结束时间</p>
                                        <p className="text-sm">{format(new Date(session.end_time), 'yyyy-MM-dd HH:mm:ss')}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">持续时长</p>
                                    <p className="text-sm font-medium">{formatDuration(session.duration)}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
                                        <Activity className="h-3 w-3" />
                                        总事件数
                                    </p>
                                    <p className="text-2xl font-bold">{session.event_count}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-1">错误数</p>
                                    <p className="text-2xl font-bold text-red-600">{session.error_count}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-1">页面浏览</p>
                                    <p className="text-2xl font-bold">{session.page_count}</p>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <p className="text-sm text-muted-foreground mb-1">会话状态</p>
                                <Badge variant={session.is_active ? 'default' : 'secondary'}>
                                    {session.is_active ? '活跃中' : '已结束'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {session.deviceInfo && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Monitor className="h-4 w-4" />
                                    设备信息
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">浏览器</p>
                                    <p className="text-sm">{session.deviceInfo.browser || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">操作系统</p>
                                    <p className="text-sm">{session.deviceInfo.os || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">设备类型</p>
                                    <p className="text-sm">{session.deviceInfo.device || '-'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                事件时间轴
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {events.length === 0 ? (
                                <p className="text-sm text-muted-foreground">暂无事件数据</p>
                            ) : (
                                <div className="space-y-2">
                                    {events.map((event, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                            <div className="flex flex-col items-center">
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                                {index < events.length - 1 && <div className="w-px h-full bg-border mt-1" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {event.event_type}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(event.timestamp), 'HH:mm:ss')}
                                                    </span>
                                                </div>
                                                <p className="text-sm">{event.event_name}</p>
                                                {event.data && (
                                                    <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto max-h-32">
                                                        {JSON.stringify(event.data, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}
