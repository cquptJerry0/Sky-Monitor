import { useQuery } from '@tanstack/react-query'
import { formatDate } from 'date-fns'
import { Activity, ListFilter } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { fetchHttpErrors, fetchEvents } from '@/services'

export function HttpErrors() {
    const [statusFilter, setStatusFilter] = useState<'all' | '4xx' | '5xx'>('all')

    const { data: httpErrorsData, isLoading } = useQuery({
        queryKey: ['httpErrors', statusFilter],
        queryFn: () => fetchHttpErrors({ limit: 100 }),
    })

    const { data: slowRequestsData } = useQuery({
        queryKey: ['slowRequests'],
        queryFn: () => fetchEvents({ eventType: 'performance', limit: 50 }),
    })

    const httpErrors = httpErrorsData?.data?.data || []
    const filteredErrors = httpErrors.filter(error => {
        if (statusFilter === '4xx') return error.http_status >= 400 && error.http_status < 500
        if (statusFilter === '5xx') return error.http_status >= 500 && error.http_status < 600
        return true
    })

    const errorsByStatus = filteredErrors.reduce(
        (acc, error) => {
            const statusGroup = Math.floor(error.http_status / 100) * 100
            const key = `${statusGroup}xx`
            acc[key] = (acc[key] || 0) + 1
            return acc
        },
        {} as Record<string, number>
    )

    const statusChartData = Object.entries(errorsByStatus).map(([status, count]) => ({
        status,
        count,
    }))

    const slowRequests = (slowRequestsData?.data?.data || [])
        .filter((event: any) => {
            try {
                const eventData = typeof event.event_data === 'string' ? JSON.parse(event.event_data) : event.event_data
                return eventData.isSlow === true
            } catch {
                return false
            }
        })
        .slice(0, 10)

    return (
        <div className="flex-1 flex-col">
            <header className="flex items-center justify-between h-[36px] mb-4">
                <h1 className="flex flex-row items-center text-xl font-semibold">
                    <Activity className="h-6 w-6 mr-2" />
                    HTTP错误监控
                </h1>
            </header>

            <div className="grid gap-4 mb-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>总错误数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filteredErrors.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>4xx 错误</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {filteredErrors.filter(e => e.http_status >= 400 && e.http_status < 500).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>5xx 错误</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {filteredErrors.filter(e => e.http_status >= 500 && e.http_status < 600).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 mb-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>状态码分布</CardTitle>
                        <CardDescription>按状态码分组统计</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            className="w-full h-64"
                            config={{
                                count: {
                                    color: 'hsl(var(--chart-1))',
                                },
                            }}
                        >
                            <BarChart data={statusChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="status" />
                                <YAxis />
                                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>慢请求 Top 10</CardTitle>
                        <CardDescription>响应时间超过3秒的请求</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {slowRequests.length === 0 ? (
                                <p className="text-sm text-muted-foreground">暂无慢请求</p>
                            ) : (
                                slowRequests.slice(0, 5).map((event: any) => {
                                    const eventData = typeof event.event_data === 'string' ? JSON.parse(event.event_data) : event.event_data
                                    return (
                                        <div key={event.id} className="flex items-center justify-between text-sm">
                                            <span className="truncate max-w-[200px]">{eventData.url || 'Unknown'}</span>
                                            <Badge variant="outline">{eventData.duration || 0}ms</Badge>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>HTTP错误列表</CardTitle>
                    <CardDescription>监控HTTP请求错误，包括4xx和5xx状态码</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center mb-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 gap-1">
                                    <ListFilter className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                        筛选: {statusFilter === 'all' ? '全部' : statusFilter}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>按状态码筛选</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem checked={statusFilter === 'all'} onCheckedChange={() => setStatusFilter('all')}>
                                    全部
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={statusFilter === '4xx'} onCheckedChange={() => setStatusFilter('4xx')}>
                                    4xx 客户端错误
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={statusFilter === '5xx'} onCheckedChange={() => setStatusFilter('5xx')}>
                                    5xx 服务器错误
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>URL</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">
                                        加载中...
                                    </TableCell>
                                </TableRow>
                            ) : filteredErrors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">
                                        暂无数据
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredErrors.slice(0, 50).map(error => (
                                    <TableRow key={error.id}>
                                        <TableCell className="max-w-[300px] truncate">{error.http_url}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{error.http_method}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={error.http_status >= 500 ? 'destructive' : 'secondary'}>
                                                {error.http_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{error.http_duration}ms</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {formatDate(new Date(error.timestamp), 'yyyy-MM-dd HH:mm:ss')}
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
