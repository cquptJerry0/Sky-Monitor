import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Activity, Clock, TrendingDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

import { StatCard } from '@/components/StatCard'
import { TimeRangePicker } from '@/components/TimeRangePicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import * as sessionService from '@/services/sessions'
import { SessionEvent } from '@/types/api'

import { SessionDetailDialog } from './SessionDetailDialog'

export function Sessions() {
    const [selectedAppId, setSelectedAppId] = useState<string>('')
    const [timeWindow, setTimeWindow] = useState<'hour' | 'day' | 'week'>('day')
    const [selectedSession, setSelectedSession] = useState<SessionEvent | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const { data: sessionsData, isLoading } = useQuery({
        queryKey: ['sessions', selectedAppId],
        queryFn: () =>
            sessionService.fetchSessions({
                appId: selectedAppId || undefined,
                limit: 50,
            }),
        refetchInterval: 30000,
    })

    const { data: statsData } = useQuery({
        queryKey: ['session-stats', selectedAppId, timeWindow],
        queryFn: () =>
            sessionService.fetchSessionStats({
                appId: selectedAppId || 'all',
                timeWindow,
            }),
        enabled: !!selectedAppId,
    })

    const { data: trendsData } = useQuery({
        queryKey: ['session-trends', selectedAppId, timeWindow],
        queryFn: () =>
            sessionService.fetchSessionTrends({
                appId: selectedAppId || 'all',
                window: timeWindow,
                limit: 24,
            }),
        enabled: !!selectedAppId,
    })

    const sessions = sessionsData?.data?.data || []
    const stats = statsData?.data
    const trends = trendsData?.data || []

    const handleRowClick = (session: SessionEvent) => {
        setSelectedSession(session)
        setDialogOpen(true)
    }

    const formatDuration = (ms?: number) => {
        if (!ms) return '-'
        if (ms < 60000) return `${Math.floor(ms / 1000)}秒`
        return `${Math.floor(ms / 60000)}分${Math.floor((ms % 60000) / 1000)}秒`
    }

    const chartData = trends.map(trend => ({
        time: format(new Date(trend.time_bucket), timeWindow === 'hour' ? 'HH:mm' : 'MM-dd'),
        count: trend.session_count,
        avgDuration: Math.floor(trend.avg_duration / 1000),
    }))

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">会话分析</h1>
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
                <StatCard title="总会话数" value={stats?.total_sessions || 0} icon={Users} description="所有用户会话" />
                <StatCard title="活跃会话" value={stats?.active_sessions || 0} icon={Activity} description="当前在线会话" />
                <StatCard
                    title="平均时长"
                    value={stats?.avg_duration ? formatDuration(stats.avg_duration) : '-'}
                    icon={Clock}
                    description="会话平均持续时间"
                />
                <StatCard
                    title="跳出率"
                    value={stats?.bounce_rate ? `${(stats.bounce_rate * 100).toFixed(1)}%` : '-'}
                    icon={TrendingDown}
                    description="单页会话占比"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>会话趋势</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" name="会话数" strokeWidth={2} />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="avgDuration"
                                stroke="#10b981"
                                name="平均时长(秒)"
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>会话列表</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">暂无会话数据</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>会话 ID</TableHead>
                                    <TableHead>用户 ID</TableHead>
                                    <TableHead>开始时间</TableHead>
                                    <TableHead>时长</TableHead>
                                    <TableHead>事件数</TableHead>
                                    <TableHead>错误数</TableHead>
                                    <TableHead>页面数</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.map(session => (
                                    <TableRow
                                        key={session.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleRowClick(session)}
                                    >
                                        <TableCell className="font-mono text-xs">{session.session_id.substring(0, 12)}...</TableCell>
                                        <TableCell className="font-mono text-xs">{session.user_id?.substring(0, 12) || '-'}</TableCell>
                                        <TableCell>{format(new Date(session.start_time), 'MM-dd HH:mm:ss')}</TableCell>
                                        <TableCell>{formatDuration(session.duration)}</TableCell>
                                        <TableCell>{session.event_count}</TableCell>
                                        <TableCell>
                                            {session.error_count > 0 ? (
                                                <Badge variant="destructive">{session.error_count}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">0</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{session.page_count}</TableCell>
                                        <TableCell>
                                            <Badge variant={session.is_active ? 'default' : 'secondary'}>
                                                {session.is_active ? '活跃' : '结束'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={e => {
                                                    e.stopPropagation()
                                                    handleRowClick(session)
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

            {selectedSession && <SessionDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} session={selectedSession} />}
        </div>
    )
}
