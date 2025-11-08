import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

import { FilterBar, FilterField } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { TimeRangePicker } from '@/components/TimeRangePicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import * as performanceService from '@/services/performance'
import { PerformanceEvent } from '@/types/api'

import { PerformanceDetailDialog } from './PerformanceDetailDialog'

export function PerformanceMonitoring() {
    const [selectedAppId, setSelectedAppId] = useState<string>('')
    const [timeWindow, setTimeWindow] = useState<'hour' | 'day' | 'week'>('day')
    const [filters, setFilters] = useState({
        category: '',
        isSlow: '',
        search: '',
    })
    const [selectedEvent, setSelectedEvent] = useState<PerformanceEvent | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const { data: eventsData, isLoading } = useQuery({
        queryKey: ['performance-events', selectedAppId, filters],
        queryFn: () =>
            performanceService.fetchPerformanceEvents({
                appId: selectedAppId || undefined,
                category: filters.category as any,
                isSlow: filters.isSlow === 'true' ? true : filters.isSlow === 'false' ? false : undefined,
                limit: 50,
            }),
        refetchInterval: 30000,
    })

    const { data: summaryData } = useQuery({
        queryKey: ['performance-summary', selectedAppId, timeWindow],
        queryFn: () =>
            performanceService.fetchPerformanceSummary({
                appId: selectedAppId || 'all',
                timeWindow,
            }),
        enabled: !!selectedAppId,
    })

    const { data: slowRequestsData } = useQuery({
        queryKey: ['slow-requests', selectedAppId],
        queryFn: () =>
            performanceService.fetchSlowRequests({
                appId: selectedAppId || 'all',
                limit: 10,
            }),
        enabled: !!selectedAppId,
    })

    const { data: trendsData } = useQuery({
        queryKey: ['performance-trends', selectedAppId, timeWindow],
        queryFn: () =>
            performanceService.fetchPerformanceTrends({
                appId: selectedAppId || 'all',
                window: timeWindow,
                limit: 24,
            }),
        enabled: !!selectedAppId,
    })

    const events = eventsData?.data?.data || []
    const summary = summaryData?.data
    const slowRequests = slowRequestsData?.data || []
    const trends = trendsData?.data || []

    const filterFields: FilterField[] = [
        {
            key: 'category',
            label: '类别',
            type: 'select',
            options: [
                { label: 'HTTP', value: 'http' },
                { label: 'Resource Timing', value: 'resourceTiming' },
            ],
        },
        {
            key: 'isSlow',
            label: '速度',
            type: 'select',
            options: [
                { label: '慢请求', value: 'true' },
                { label: '正常请求', value: 'false' },
            ],
        },
        {
            key: 'search',
            label: '搜索',
            type: 'search',
            placeholder: '搜索 URL',
        },
    ]

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const handleResetFilters = () => {
        setFilters({ category: '', isSlow: '', search: '' })
    }

    const handleRowClick = (event: PerformanceEvent) => {
        setSelectedEvent(event)
        setDialogOpen(true)
    }

    const chartData = trends.map(trend => ({
        time: format(new Date(trend.time_bucket), timeWindow === 'hour' ? 'HH:mm' : 'MM-dd'),
        p50: trend.p50_duration,
        p95: trend.p95_duration,
        p99: trend.p99_duration,
    }))

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">性能监控</h1>
                <TimeRangePicker
                    onChange={range => {
                        if (range?.from && range?.to) {
                            const days = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))
                            if (days <= 1) setTimeWindow('hour')
                            else if (days <= 7) setTimeWindow('day')
                            else setTimeWindow('week')
                        }
                    }}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="平均响应时间"
                    value={summary?.avg_duration ? `${summary.avg_duration.toFixed(0)}ms` : '-'}
                    icon={Clock}
                    description="所有请求平均耗时"
                />
                <StatCard
                    title="P95 响应时间"
                    value={summary?.p95_duration ? `${summary.p95_duration.toFixed(0)}ms` : '-'}
                    icon={TrendingUp}
                    description="95% 请求的耗时"
                />
                <StatCard
                    title="慢请求率"
                    value={summary?.slow_request_rate ? `${(summary.slow_request_rate * 100).toFixed(1)}%` : '-'}
                    icon={AlertTriangle}
                    description="> 3s 的请求占比"
                />
                <StatCard
                    title="成功率"
                    value={summary?.failure_rate ? `${((1 - summary.failure_rate) * 100).toFixed(1)}%` : '-'}
                    icon={CheckCircle}
                    description="请求成功占比"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>性能趋势 (P50 / P95 / P99)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="p50" stroke="#10b981" name="P50" strokeWidth={2} />
                            <Line type="monotone" dataKey="p95" stroke="#f59e0b" name="P95" strokeWidth={2} />
                            <Line type="monotone" dataKey="p99" stroke="#ef4444" name="P99" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {slowRequests.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>慢请求 Top 10</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {slowRequests.map((req, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline">{req.method}</Badge>
                                            <span className="text-sm font-mono truncate">{req.url}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>平均: {req.avg_duration.toFixed(0)}ms</span>
                                            <span>P95: {req.p95_duration.toFixed(0)}ms</span>
                                            <span>次数: {req.count}</span>
                                            <span>成功率: {(req.success_rate * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <FilterBar fields={filterFields} values={filters} onChange={handleFilterChange} onReset={handleResetFilters} />

            <Card>
                <CardHeader>
                    <CardTitle>性能事件列表</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">暂无性能数据</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>URL</TableHead>
                                    <TableHead>方法</TableHead>
                                    <TableHead>耗时</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.map(event => (
                                    <TableRow
                                        key={event.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleRowClick(event)}
                                    >
                                        <TableCell className="max-w-md truncate font-mono text-xs">{event.url}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{event.method || 'GET'}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={event.is_slow ? 'destructive' : 'default'}>{event.duration.toFixed(0)}ms</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={event.status && event.status >= 400 ? 'destructive' : 'default'}>
                                                {event.status || '-'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{format(new Date(event.timestamp), 'MM-dd HH:mm:ss')}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={e => {
                                                    e.stopPropagation()
                                                    handleRowClick(event)
                                                }}
                                            >
                                                详情
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {selectedEvent && <PerformanceDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} event={selectedEvent} />}
        </div>
    )
}
