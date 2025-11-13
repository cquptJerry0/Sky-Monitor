/**
 * 会话列表页
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useSessions } from '@/hooks/useEventQuery'
import { useSessionStats } from '@/hooks/useSessionQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PAGINATION } from '@/utils/constants'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { RefreshCw, Search, Play, Users, Activity, Clock, TrendingDown } from 'lucide-react'

export default function SessionsPage() {
    const navigate = useNavigate()
    const { currentApp } = useCurrentApp()
    const [searchUserId, setSearchUserId] = useState('')
    const [page, setPage] = useState(0)
    const [pageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE)
    const [timeWindow, setTimeWindow] = useState<'hour' | 'day' | 'week'>('day')

    // 查询会话统计
    const { data: stats, isLoading: statsLoading } = useSessionStats({
        appId: currentApp?.appId || '',
        timeWindow,
    })

    // 查询会话列表
    const { data, isLoading, refetch } = useSessions({
        appId: currentApp?.appId || '',
        limit: pageSize,
        offset: page * pageSize,
    })

    const sessions = Array.isArray(data) ? data : []

    // 筛选用户 ID
    const filteredSessions = sessions.filter((session: { user_id?: string }) => {
        if (searchUserId && !session.user_id?.toLowerCase().includes(searchUserId.toLowerCase())) {
            return false
        }
        return true
    })

    const handleRowClick = (sessionId: string) => {
        navigate(`/sessions/${sessionId}`)
    }

    const handleReplayClick = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        navigate(`/sessions/${sessionId}/replay`)
    }

    // 格式化时长
    const formatDuration = (ms: number) => {
        if (!ms) return '-'
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)

        if (hours > 0) {
            return `${hours}小时${minutes % 60}分钟`
        } else if (minutes > 0) {
            return `${minutes}分${seconds % 60}秒`
        } else {
            return `${seconds}秒`
        }
    }

    // 格式化百分比
    const formatPercent = (value: number) => {
        if (value === undefined || value === null) return '-'
        return `${(value * 100).toFixed(1)}%`
    }

    // 格式化大数字
    const formatNumber = (num: number) => {
        if (num === undefined || num === null) return '-'
        return num.toLocaleString()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">会话列表</h1>
                    <p className="text-muted-foreground mt-1">查看用户会话和行为记录</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={timeWindow} onValueChange={(value: 'hour' | 'day' | 'week') => setTimeWindow(value)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="hour">最近 1 小时</SelectItem>
                            <SelectItem value="day">最近 1 天</SelectItem>
                            <SelectItem value="week">最近 7 天</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        刷新
                    </Button>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">总会话数</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <div className="text-2xl font-bold text-muted-foreground">-</div>
                        ) : (
                            <div className="text-2xl font-bold">{formatNumber(stats?.total_sessions ?? 0)}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">统计时间窗口内的会话总数</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">活跃会话</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <div className="text-2xl font-bold text-muted-foreground">-</div>
                        ) : (
                            <div className="text-2xl font-bold">{formatNumber(stats?.active_sessions ?? 0)}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">最近 30 分钟内活跃的会话</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">平均时长</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <div className="text-2xl font-bold text-muted-foreground">-</div>
                        ) : (
                            <div className="text-2xl font-bold">{formatDuration(stats?.avg_duration ?? 0)}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">会话平均持续时间</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">跳出率</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <div className="text-2xl font-bold text-muted-foreground">-</div>
                        ) : (
                            <div className="text-2xl font-bold">{formatPercent(stats?.bounce_rate ?? 0)}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">单页面会话占比</p>
                    </CardContent>
                </Card>
            </div>

            {/* 筛选器 */}
            <Card>
                <CardHeader>
                    <CardTitle>筛选条件</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Button variant="outline" size="sm" onClick={() => setSearchUserId('')}>
                            重置筛选
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 会话列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>会话列表（共 {filteredSessions.length} 条）</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">暂无会话</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>会话 ID</TableHead>
                                    <TableHead>用户 ID</TableHead>
                                    <TableHead>事件数</TableHead>
                                    <TableHead>持续时间</TableHead>
                                    <TableHead>开始时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSessions.map((session: any) => (
                                    <TableRow
                                        key={session.session_id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleRowClick(session.session_id)}
                                    >
                                        <TableCell className="font-mono text-sm">{session.session_id.slice(0, 12)}...</TableCell>
                                        <TableCell>{session.user_id || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{session.event_count}</Badge>
                                        </TableCell>
                                        <TableCell>{session.duration ? `${(session.duration / 1000).toFixed(1)}s` : '-'}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(session.start_time), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" onClick={e => handleReplayClick(session.session_id, e)}>
                                                <Play className="h-4 w-4 mr-1" />
                                                回放
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
