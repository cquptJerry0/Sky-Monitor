/**
 * 慢请求页
 */

import { useState } from 'react'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useSlowRequests } from '@/hooks/useEventQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CHART_COLORS, PAGINATION } from '@/utils/constants'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { RefreshCw, Clock } from 'lucide-react'

export default function SlowRequestsPage() {
    const { currentApp } = useCurrentApp()
    const [threshold, setThreshold] = useState(1000)
    const [page, setPage] = useState(0)
    const [pageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE)

    // 查询慢请求
    const { data, isLoading, refetch } = useSlowRequests({
        appId: currentApp?.appId || '',
        threshold,
        limit: pageSize,
        offset: page * pageSize,
    })

    const slowRequests = data || []

    // 转换为图表数据（横向柱状图）
    const chartData = slowRequests.slice(0, 10).map(req => ({
        url: req.url?.split('?')[0].slice(-30) || 'Unknown',
        duration: req.performance_value || 0,
        fullUrl: req.url,
    }))

    const getColorByDuration = (duration: number) => {
        if (duration > 5000) return CHART_COLORS.ERROR
        if (duration > 3000) return CHART_COLORS.WARNING
        return CHART_COLORS.INFO
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">慢请求</h1>
                    <p className="text-muted-foreground mt-1">查看响应时间超过阈值的请求</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    刷新
                </Button>
            </div>

            {/* 筛选器 */}
            <Card>
                <CardHeader>
                    <CardTitle>筛选条件</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">响应时间阈值（毫秒）</label>
                            <Input
                                type="number"
                                value={threshold}
                                onChange={e => setThreshold(Number(e.target.value))}
                                min={100}
                                step={100}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">慢请求总数</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{slowRequests.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {slowRequests.length > 0
                                ? (slowRequests.reduce((sum, req) => sum + (req.performance_value || 0), 0) / slowRequests.length).toFixed(
                                      0
                                  )
                                : 0}
                            <span className="text-sm font-normal text-muted-foreground ml-1">ms</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">最慢请求</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" style={{ color: CHART_COLORS.ERROR }}>
                            {slowRequests.length > 0 ? Math.max(...slowRequests.map(req => req.performance_value || 0)).toFixed(0) : 0}
                            <span className="text-sm font-normal text-muted-foreground ml-1">ms</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 慢请求图表（横向柱状图） */}
            <Card>
                <CardHeader>
                    <CardTitle>Top 10 慢请求</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : chartData.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">暂无慢请求</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={chartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis type="category" dataKey="url" stroke="hsl(var(--muted-foreground))" fontSize={10} width={150} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px',
                                    }}
                                    formatter={(value: any) => [`${value.toFixed(0)} ms`, '响应时间']}
                                />
                                <Bar dataKey="duration" radius={[0, 4, 4, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getColorByDuration(entry.duration)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* 慢请求列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>慢请求列表</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : slowRequests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">暂无慢请求</div>
                    ) : (
                        <div className="space-y-3">
                            {slowRequests.map(req => (
                                <div key={req.id} className="p-4 border rounded-lg hover:bg-muted/50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-mono text-sm truncate">{req.url}</div>
                                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                                <span>{format(new Date(req.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}</span>
                                                {req.user_id && <span>用户: {req.user_id}</span>}
                                            </div>
                                        </div>
                                        <div className="ml-4 flex items-center gap-2">
                                            <Badge
                                                variant="secondary"
                                                style={{ backgroundColor: getColorByDuration(req.performance_value || 0) }}
                                            >
                                                {(req.performance_value || 0).toFixed(0)} ms
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
