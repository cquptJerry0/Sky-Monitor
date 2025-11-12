/**
 * 仪表盘页
 */

import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useEventStats } from '@/hooks/useEventQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { CHART_COLORS } from '@/utils/constants'
import { formatLargeNumber } from '@/utils/chart'
import { Activity, AlertCircle, Clock, Users } from 'lucide-react'

export default function DashboardPage() {
    const { currentApp } = useCurrentApp()
    const { data: stats, isLoading } = useEventStats(currentApp?.appId || null)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">加载中...</div>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">暂无数据</div>
            </div>
        )
    }

    // 事件类型分布数据（饼图）
    const eventTypeData = [
        { name: '错误', value: stats.error_count, color: CHART_COLORS.ERROR },
        { name: '性能', value: stats.performance_count, color: CHART_COLORS.INFO },
        { name: 'Web Vitals', value: stats.web_vital_count || 0, color: CHART_COLORS.SUCCESS },
        { name: '会话', value: stats.session_count, color: CHART_COLORS.PRIMARY },
    ].filter(item => item.value > 0)

    // 事件统计数据（柱状图）
    const eventStatsData = [
        { name: '错误', count: stats.error_count },
        { name: '性能', count: stats.performance_count },
        { name: 'Web Vitals', count: stats.web_vital_count || 0 },
        { name: '会话', count: stats.session_count },
        { name: 'HTTP 错误', count: stats.http_error_count || 0 },
        { name: '资源错误', count: stats.resource_error_count || 0 },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">仪表盘</h1>
                <p className="text-muted-foreground mt-1">应用监控总览</p>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">总事件数</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatLargeNumber(stats.total_events)}</div>
                        <p className="text-xs text-muted-foreground mt-1">所有类型事件</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">错误数量</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" style={{ color: CHART_COLORS.ERROR }}>
                            {formatLargeNumber(stats.error_count)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">包含所有错误类型</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">性能事件</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" style={{ color: CHART_COLORS.INFO }}>
                            {formatLargeNumber(stats.performance_count)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">性能监控数据</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">会话数量</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" style={{ color: CHART_COLORS.PRIMARY }}>
                            {formatLargeNumber(stats.session_count)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">用户会话统计</p>
                    </CardContent>
                </Card>
            </div>

            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 事件类型分布（饼图） */}
                <Card>
                    <CardHeader>
                        <CardTitle>事件类型分布</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={eventTypeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={entry => `${entry.name}: ${formatLargeNumber(entry.value)}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {eventTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={value => formatLargeNumber(Number(value))} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 事件统计（柱状图） */}
                <Card>
                    <CardHeader>
                        <CardTitle>事件统计</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={eventStatsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <Tooltip
                                    formatter={value => formatLargeNumber(Number(value))}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px',
                                    }}
                                />
                                <Bar dataKey="count" fill={CHART_COLORS.PRIMARY} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
