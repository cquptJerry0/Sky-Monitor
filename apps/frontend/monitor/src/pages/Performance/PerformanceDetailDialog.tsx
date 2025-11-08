import { format } from 'date-fns'
import { Clock, Network, Link as LinkIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PerformanceEvent } from '@/types/api'

interface PerformanceDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    event: PerformanceEvent
}

export function PerformanceDetailDialog({ open, onOpenChange, event }: PerformanceDetailDialogProps) {
    const timingData = event.timing
        ? [
              { label: 'DNS', value: event.timing.dns, color: '#3b82f6' },
              { label: 'TCP', value: event.timing.tcp, color: '#10b981' },
              { label: 'TTFB', value: event.timing.ttfb, color: '#f59e0b' },
              { label: 'Download', value: event.timing.download, color: '#ef4444' },
          ]
        : []

    const maxValue = Math.max(...timingData.map(d => d.value || 0))

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        性能详情
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">基本信息</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                    <LinkIcon className="h-3 w-3" />
                                    URL
                                </p>
                                <p className="text-sm font-mono break-all bg-muted p-2 rounded">{event.url}</p>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">请求方法</p>
                                    <Badge variant="outline">{event.method || 'GET'}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">状态码</p>
                                    <Badge variant={event.status && event.status >= 400 ? 'destructive' : 'default'}>
                                        {event.status || '-'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">总耗时</p>
                                    <Badge variant={event.is_slow ? 'destructive' : 'default'}>{event.duration.toFixed(0)}ms</Badge>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">类别</p>
                                    <Badge variant="outline">{event.category}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">发生时间</p>
                                    <p className="text-sm font-mono">{format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {event.timing && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Network className="h-4 w-4" />
                                    性能时序分析
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    {timingData.map(item => (
                                        <div key={item.label}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">{item.label}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {item.value ? `${item.value.toFixed(0)}ms` : '-'}
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: item.value ? `${(item.value / maxValue) * 100}%` : '0%',
                                                        backgroundColor: item.color,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator />

                                <div className="grid grid-cols-4 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">DNS 解析</p>
                                        <p className="text-sm font-medium">{event.timing.dns ? `${event.timing.dns.toFixed(0)}ms` : '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">TCP 连接</p>
                                        <p className="text-sm font-medium">{event.timing.tcp ? `${event.timing.tcp.toFixed(0)}ms` : '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">首字节时间</p>
                                        <p className="text-sm font-medium">
                                            {event.timing.ttfb ? `${event.timing.ttfb.toFixed(0)}ms` : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">下载时间</p>
                                        <p className="text-sm font-medium">
                                            {event.timing.download ? `${event.timing.download.toFixed(0)}ms` : '-'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {event.headers && Object.keys(event.headers).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">请求头</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(event.headers).map(([key, value]) => (
                                        <div key={key} className="flex items-start gap-2 text-xs">
                                            <span className="font-mono text-muted-foreground min-w-[150px]">{key}:</span>
                                            <span className="font-mono flex-1 break-all">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
