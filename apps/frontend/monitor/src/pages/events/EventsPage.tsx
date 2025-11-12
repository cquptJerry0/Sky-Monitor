/**
 * 事件列表页
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useEvents } from '@/hooks/useEventQuery'
import { useSSEStream } from '@/api/sse/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EVENT_TYPE_LABELS, PAGINATION } from '@/utils/constants'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Search, RefreshCw } from 'lucide-react'
import type { Event, EventType } from '@/api/types'

export default function EventsPage() {
    const navigate = useNavigate()
    const { currentApp } = useCurrentApp()
    const [eventType, setEventType] = useState<string>('all')
    const [searchUrl, setSearchUrl] = useState('')
    const [searchUserId, setSearchUserId] = useState('')
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE)

    // 查询事件列表
    const { data, isLoading, refetch } = useEvents({
        appId: currentApp?.appId || '',
        eventType: eventType === 'all' ? undefined : eventType,
        limit: pageSize,
        offset: page * pageSize,
    })

    // SSE 实时推送
    const { items: realtimeEvents, clear: clearRealtimeEvents } = useSSEStream<Event>(
        `/events/stream/events?appId=${currentApp?.appId || ''}&type=${eventType === 'all' ? '' : eventType}`,
        !!currentApp?.appId,
        50
    )

    const events = data?.data || []
    const total = data?.total || 0
    const totalPages = Math.ceil(total / pageSize)

    // 筛选事件（URL 和用户 ID）
    const filteredEvents = events.filter(event => {
        if (searchUrl && !event.url?.toLowerCase().includes(searchUrl.toLowerCase())) {
            return false
        }
        if (searchUserId && !event.user_id?.toLowerCase().includes(searchUserId.toLowerCase())) {
            return false
        }
        return true
    })

    // 合并实时事件和列表事件（去重）
    const allEvents = [...realtimeEvents, ...filteredEvents].reduce((acc, event) => {
        if (!acc.find(e => e.id === event.id)) {
            acc.push(event)
        }
        return acc
    }, [] as Event[])

    const handleRowClick = (eventId: string) => {
        navigate(`/events/${eventId}`)
    }

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">事件列表</h1>
                    <p className="text-muted-foreground mt-1">查看所有监控事件</p>
                </div>
                <div className="flex items-center gap-2">
                    {realtimeEvents.length > 0 && <Badge variant="secondary">{realtimeEvents.length} 条新事件</Badge>}
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        刷新
                    </Button>
                </div>
            </div>

            {/* 筛选器 */}
            <Card>
                <CardHeader>
                    <CardTitle>筛选条件</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">事件类型</label>
                            <Select value={eventType} onValueChange={setEventType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部</SelectItem>
                                    <SelectItem value="error">错误</SelectItem>
                                    <SelectItem value="httpError">HTTP 错误</SelectItem>
                                    <SelectItem value="resourceError">资源错误</SelectItem>
                                    <SelectItem value="performance">性能</SelectItem>
                                    <SelectItem value="webVital">Web Vitals</SelectItem>
                                    <SelectItem value="session">会话</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">URL 搜索</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="搜索 URL..."
                                    value={searchUrl}
                                    onChange={e => setSearchUrl(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">用户 ID 搜索</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="搜索用户 ID..."
                                    value={searchUserId}
                                    onChange={e => setSearchUserId(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setEventType('all')
                                setSearchUrl('')
                                setSearchUserId('')
                                clearRealtimeEvents()
                            }}
                        >
                            重置筛选
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 事件列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>事件列表（共 {total} 条）</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : allEvents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">暂无事件</div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>类型</TableHead>
                                        <TableHead>消息</TableHead>
                                        <TableHead>URL</TableHead>
                                        <TableHead>用户</TableHead>
                                        <TableHead>时间</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allEvents.map(event => (
                                        <TableRow
                                            key={event.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleRowClick(event.id)}
                                        >
                                            <TableCell>{getEventTypeBadge(event.event_type)}</TableCell>
                                            <TableCell className="max-w-md truncate">
                                                {event.error_message || event.performance_metric || event.web_vital_name || '-'}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">{event.url || '-'}</TableCell>
                                            <TableCell>{event.user_id || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* 分页 */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    显示 {page * pageSize + 1} - {Math.min((page + 1) * pageSize, total)} 条，共 {total} 条
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                                        上一页
                                    </Button>
                                    <span className="text-sm">
                                        第 {page + 1} / {totalPages} 页
                                    </span>
                                    <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                                        下一页
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
