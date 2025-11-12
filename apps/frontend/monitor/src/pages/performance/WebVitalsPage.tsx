/**
 * Web Vitals 页
 */

import { useState } from 'react'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useEvents } from '@/hooks/useEventQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CHART_COLORS, PAGINATION } from '@/utils/constants'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function WebVitalsPage() {
    const { currentApp } = useCurrentApp()
    const [metric, setMetric] = useState<string>('LCP')

    // 查询 Web Vitals 事件
    const { data, isLoading } = useEvents({
        appId: currentApp?.appId || '',
        eventType: 'webVital',
        limit: PAGINATION.DEFAULT_PAGE_SIZE,
    })

    const events = data?.data || []

    // 筛选指定指标的事件
    const filteredEvents = events.filter(e => e.web_vital_name === metric)

    // 转换为图表数据
    const chartData = filteredEvents.map((event, index) => ({
        index: index + 1,
        value: event.web_vital_value || 0,
        rating: event.web_vital_rating,
        timestamp: format(new Date(event.timestamp), 'HH:mm:ss', { locale: zhCN }),
    }))

    // Web Vitals 阈值配置
    const thresholds: Record<string, { good: number; needsImprovement: number }> = {
        LCP: { good: 2500, needsImprovement: 4000 },
        FID: { good: 100, needsImprovement: 300 },
        CLS: { good: 0.1, needsImprovement: 0.25 },
        FCP: { good: 1800, needsImprovement: 3000 },
        TTFB: { good: 800, needsImprovement: 1800 },
    }

    const threshold = thresholds[metric] || { good: 0, needsImprovement: 0 }

    // 统计各评级数量
    const ratingStats = {
        good: filteredEvents.filter(e => e.web_vital_rating === 'good').length,
        needsImprovement: filteredEvents.filter(e => e.web_vital_rating === 'needs-improvement').length,
        poor: filteredEvents.filter(e => e.web_vital_rating === 'poor').length,
    }

    const getRatingBadge = (rating: string) => {
        const variants: Record<string, any> = {
            good: 'default',
            'needs-improvement': 'secondary',
            poor: 'destructive',
        }
        const labels: Record<string, string> = {
            good: '良好',
            'needs-improvement': '需改进',
            poor: '差',
        }
        return <Badge variant={variants[rating]}>{labels[rating] || rating}</Badge>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Web Vitals</h1>
                <p className="text-muted-foreground mt-1">查看核心 Web 性能指标</p>
            </div>

            {/* 筛选器 */}
            <Card>
                <CardHeader>
                    <CardTitle>选择指标</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Web Vital 指标</label>
                            <Select value={metric} onValueChange={setMetric}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LCP">LCP - 最大内容绘制</SelectItem>
                                    <SelectItem value="FID">FID - 首次输入延迟</SelectItem>
                                    <SelectItem value="CLS">CLS - 累积布局偏移</SelectItem>
                                    <SelectItem value="FCP">FCP - 首次内容绘制</SelectItem>
                                    <SelectItem value="TTFB">TTFB - 首字节时间</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">总样本数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filteredEvents.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">良好</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" style={{ color: CHART_COLORS.SUCCESS }}>
                            {ratingStats.good}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {filteredEvents.length > 0 ? ((ratingStats.good / filteredEvents.length) * 100).toFixed(1) : 0}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">需改进</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" style={{ color: CHART_COLORS.WARNING }}>
                            {ratingStats.needsImprovement}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {filteredEvents.length > 0 ? ((ratingStats.needsImprovement / filteredEvents.length) * 100).toFixed(1) : 0}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">差</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" style={{ color: CHART_COLORS.ERROR }}>
                            {ratingStats.poor}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {filteredEvents.length > 0 ? ((ratingStats.poor / filteredEvents.length) * 100).toFixed(1) : 0}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Web Vitals 趋势图 */}
            <Card>
                <CardHeader>
                    <CardTitle>{metric} 趋势图</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : chartData.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">暂无数据</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px',
                                    }}
                                />
                                <Legend />
                                {/* 良好阈值线 */}
                                <ReferenceLine
                                    y={threshold.good}
                                    stroke={CHART_COLORS.SUCCESS}
                                    strokeDasharray="3 3"
                                    label={{ value: '良好', position: 'right', fill: CHART_COLORS.SUCCESS }}
                                />
                                {/* 需改进阈值线 */}
                                <ReferenceLine
                                    y={threshold.needsImprovement}
                                    stroke={CHART_COLORS.WARNING}
                                    strokeDasharray="3 3"
                                    label={{ value: '需改进', position: 'right', fill: CHART_COLORS.WARNING }}
                                />
                                <Line type="monotone" dataKey="value" stroke={CHART_COLORS.INFO} strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* 指标说明 */}
            <Card>
                <CardHeader>
                    <CardTitle>指标说明</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="font-medium mb-1">LCP - 最大内容绘制（Largest Contentful Paint）</div>
                        <p className="text-sm text-muted-foreground">
                            测量页面主要内容加载完成的时间。良好: &lt; 2.5s，需改进: 2.5s - 4s，差: &gt; 4s
                        </p>
                    </div>
                    <div>
                        <div className="font-medium mb-1">FID - 首次输入延迟（First Input Delay）</div>
                        <p className="text-sm text-muted-foreground">
                            测量用户首次与页面交互到浏览器响应的时间。良好: &lt; 100ms，需改进: 100ms - 300ms，差: &gt; 300ms
                        </p>
                    </div>
                    <div>
                        <div className="font-medium mb-1">CLS - 累积布局偏移（Cumulative Layout Shift）</div>
                        <p className="text-sm text-muted-foreground">
                            测量页面视觉稳定性。良好: &lt; 0.1，需改进: 0.1 - 0.25，差: &gt; 0.25
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
