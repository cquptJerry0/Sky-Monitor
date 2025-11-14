import { useMemo, useState, useEffect } from 'react'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useEvents } from '@/hooks/useEventQuery'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EventDetailDrawer } from '@/components/events/EventDetailDrawer'
import { EventFilters, type EventFiltersState } from '@/components/events/EventFilters'
import { EventListRow } from '@/components/events/EventListRow'
import { EventListSkeleton } from '@/components/events/EventListSkeleton'
import { EventStats } from '@/components/events/EventStats'
import { PAGINATION } from '@/utils/constants'
import { AlertCircle, RefreshCw } from 'lucide-react'
import type { Event } from '@/api/types'

export default function EventsPage() {
    const { currentApp } = useCurrentApp()
    const [page, setPage] = useState(0)
    const [pageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE)
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [showLoading, setShowLoading] = useState(false)

    const [filters, setFilters] = useState<EventFiltersState>({
        eventType: 'all',
        timeRange: '1h',
    })

    // 将 timeRange 转换为 startTime 和 endTime
    const getTimeRange = (timeRange: string) => {
        const now = new Date()
        const end = now.toISOString()
        let start: string

        switch (timeRange) {
            case '15m':
                start = new Date(now.getTime() - 15 * 60 * 1000).toISOString()
                break
            case '1h':
                start = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
                break
            case '6h':
                start = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
                break
            case '24h':
                start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
                break
            case '7d':
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
                break
            case '30d':
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
                break
            default:
                start = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
        }

        return { startTime: start, endTime: end }
    }

    const timeRange = getTimeRange(filters.timeRange)

    // 使用 React Query 轮询,每 5 秒自动刷新
    const { data, isLoading, refetch } = useEvents({
        appId: currentApp?.appId || '',
        eventType: filters.eventType === 'all' ? undefined : filters.eventType,
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
        limit: pageSize,
        offset: page * pageSize,
        refetchInterval: 5000, // 每 5 秒自动刷新
    })

    // 确保 loading
    useEffect(() => {
        if (isLoading) {
            setShowLoading(true)
            return
        }

        const timer = setTimeout(() => {
            setShowLoading(false)
        }, 400)

        return () => clearTimeout(timer)
    }, [isLoading])

    const events = data?.data || []
    const total = data?.total || 0
    const totalPages = Math.ceil(total / pageSize)

    // 不需要前端筛选了,直接使用后端返回的数据
    const filteredEvents = events

    // 统计数据
    const stats = useMemo(() => {
        const errorTypes = ['error', 'exception', 'unhandledrejection']
        return {
            total: filteredEvents.length,
            errors: filteredEvents.filter(e => errorTypes.includes(e.event_type)).length,
            performance: filteredEvents.filter(e => e.event_type === 'performance').length,
            sessions: filteredEvents.filter(e => e.event_type === 'session').length,
            webVitals: filteredEvents.filter(e => e.event_type === 'webVital').length,
        }
    }, [filteredEvents])

    const handleEventClick = (event: Event) => {
        setSelectedEvent(event)
        setDrawerOpen(true)
    }

    const handleFiltersChange = (newFilters: EventFiltersState) => {
        setFilters(newFilters)
        setPage(0)
    }

    const handleReset = () => {
        setFilters({
            eventType: 'all',
            timeRange: '1h',
        })
        setPage(0)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">事件列表</h1>
                    <p className="mt-1 text-muted-foreground">查看所有监控事件</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    刷新
                </Button>
            </div>

            <EventStats
                total={stats.total}
                errors={stats.errors}
                performance={stats.performance}
                sessions={stats.sessions}
                webVitals={stats.webVitals}
            />

            <EventFilters filters={filters} onFiltersChange={handleFiltersChange} />

            <Card>
                <CardHeader>
                    <CardTitle>事件列表（共 {total} 条）</CardTitle>
                </CardHeader>
                <CardContent>
                    {showLoading ? (
                        <EventListSkeleton rows={10} />
                    ) : filteredEvents.length === 0 ? (
                        <div className="py-12 text-center">
                            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">暂无事件</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={handleReset}>
                                清空筛选条件
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>时间</TableHead>
                                        <TableHead>类型</TableHead>
                                        <TableHead>消息</TableHead>
                                        <TableHead>路径</TableHead>
                                        <TableHead>用户</TableHead>
                                        <TableHead>会话</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEvents.map(event => (
                                        <EventListRow key={event.id} event={event} onClick={handleEventClick} />
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="mt-4 flex items-center justify-between">
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

            <EventDetailDrawer event={selectedEvent} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </div>
    )
}
