/**
 * 性能总览页
 */

import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useEventStats } from '@/hooks/useEventQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CHART_COLORS } from '@/utils/constants'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Clock, Zap, Activity } from 'lucide-react'

export default function PerformancePage() {
    const { currentApp } = useCurrentApp()

    // 查询性能统计
    const { data: stats, isLoading } = useEventStats(currentApp?.appId || '', '24h')

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

    // 性能指标数据
    const performanceData = [
        {
            name: '性能事件',
            value: stats.performance_count,
            color: CHART_COLORS.INFO,
        },
        {
            name: 'Web Vitals',
            value: stats.web_vital_count || 0,
            color: CHART_COLORS.SUCCESS,
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">性能总览</h1>
                <p className="text-muted-foreground mt-1">查看应用性能指标和统计</p>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">性能事件</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.performance_count}</div>
                        <p className="text-xs text-muted-foreground mt-1">最近 24 小时</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Web Vitals</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.web_vital_count || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">最近 24 小时</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">总事件数</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_events}</div>
                        <p className="text-xs text-muted-foreground mt-1">最近 24 小时</p>
                    </CardContent>
                </Card>
            </div>

            {/* 性能统计图表 */}
            <Card>
                <CardHeader>
                    <CardTitle>性能事件统计</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px',
                                }}
                            />
                            <Bar dataKey="value" fill={CHART_COLORS.INFO} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 性能指标说明 */}
            <Card>
                <CardHeader>
                    <CardTitle>性能指标说明</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="font-medium mb-1">性能事件</div>
                        <p className="text-sm text-muted-foreground">包括页面加载时间、资源加载时间、API 请求时间等性能相关事件</p>
                    </div>
                    <div>
                        <div className="font-medium mb-1">Web Vitals</div>
                        <p className="text-sm text-muted-foreground">
                            包括 LCP（最大内容绘制）、FID（首次输入延迟）、CLS（累积布局偏移）等核心 Web 指标
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
