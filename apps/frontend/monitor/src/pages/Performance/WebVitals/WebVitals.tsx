import { useQuery } from '@tanstack/react-query'
import { Gauge } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fetchWebVitals } from '@/services'

export function WebVitals() {
    const { data: webVitalsData, isLoading } = useQuery({
        queryKey: ['webVitals'],
        queryFn: () => fetchWebVitals({ limit: 200 }),
    })

    const webVitals = webVitalsData?.data?.data || []

    const metricsByName = webVitals.reduce(
        (acc, vital) => {
            const name = vital.event_name
            if (!acc[name]) {
                acc[name] = []
            }
            acc[name].push(vital.perf_value)
            return acc
        },
        {} as Record<string, number[]>
    )

    const calculatePercentiles = (values: number[]) => {
        if (values.length === 0) return { p50: 0, p75: 0, p95: 0, p99: 0, avg: 0 }

        const sorted = [...values].sort((a, b) => a - b)
        const p50 = sorted[Math.floor(sorted.length * 0.5)]
        const p75 = sorted[Math.floor(sorted.length * 0.75)]
        const p95 = sorted[Math.floor(sorted.length * 0.95)]
        const p99 = sorted[Math.floor(sorted.length * 0.99)]
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length

        return { p50, p75, p95, p99, avg }
    }

    const getScoreVariant = (name: string, value: number): 'default' | 'secondary' | 'destructive' => {
        const thresholds: Record<string, { good: number; poor: number }> = {
            LCP: { good: 2500, poor: 4000 },
            FCP: { good: 1800, poor: 3000 },
            CLS: { good: 0.1, poor: 0.25 },
            TTFB: { good: 800, poor: 1800 },
        }

        const threshold = thresholds[name]
        if (!threshold) return 'secondary'

        if (value <= threshold.good) return 'default'
        if (value <= threshold.poor) return 'secondary'
        return 'destructive'
    }

    const getScoreLabel = (name: string, value: number): string => {
        const thresholds: Record<string, { good: number; poor: number }> = {
            LCP: { good: 2500, poor: 4000 },
            FCP: { good: 1800, poor: 3000 },
            CLS: { good: 0.1, poor: 0.25 },
            TTFB: { good: 800, poor: 1800 },
        }

        const threshold = thresholds[name]
        if (!threshold) return 'Unknown'

        if (value <= threshold.good) return 'Good'
        if (value <= threshold.poor) return 'Needs Improvement'
        return 'Poor'
    }

    const metrics = ['LCP', 'FCP', 'CLS', 'TTFB']
    const metricsData = metrics.map(name => {
        const values = metricsByName[name] || []
        const percentiles = calculatePercentiles(values)
        return { name, ...percentiles, count: values.length }
    })

    const distributionData = (name: string) => {
        const values = metricsByName[name] || []
        if (values.length === 0) return []

        const max = Math.max(...values)
        const bucketSize = max / 10
        const buckets = Array(10).fill(0)

        values.forEach(v => {
            const bucket = Math.min(Math.floor(v / bucketSize), 9)
            buckets[bucket]++
        })

        return buckets.map((count, i) => ({
            range: `${Math.round(i * bucketSize)}-${Math.round((i + 1) * bucketSize)}`,
            count,
        }))
    }

    const metricDescriptions: Record<string, { title: string; desc: string }> = {
        LCP: { title: 'LCP - 最大内容绘制', desc: '页面主要内容加载时间' },
        FCP: { title: 'FCP - 首次内容绘制', desc: '首次渲染内容的时间' },
        CLS: { title: 'CLS - 累积布局偏移', desc: '页面布局稳定性' },
        TTFB: { title: 'TTFB - 首字节时间', desc: '服务器响应时间' },
    }

    return (
        <div className="flex-1 flex-col">
            <header className="flex items-center justify-between h-[36px] mb-4">
                <h1 className="flex flex-row items-center text-xl font-semibold">
                    <Gauge className="h-6 w-6 mr-2" />
                    Web Vitals 性能指标
                </h1>
            </header>

            <div className="grid gap-4 mb-4 md:grid-cols-2 lg:grid-cols-4">
                {metrics.map(name => {
                    const data = metricsData.find(m => m.name === name)
                    const value = data?.p50 || 0
                    return (
                        <Card key={name}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    {name}
                                    <Badge variant={getScoreVariant(name, value)}>{getScoreLabel(name, value)}</Badge>
                                </CardTitle>
                                <CardDescription>{metricDescriptions[name]?.desc}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {data?.p50 ? `${Math.round(data.p50)}${name === 'CLS' ? '' : 'ms'}` : '-'}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    P95: {data?.p95 ? `${Math.round(data.p95)}${name === 'CLS' ? '' : 'ms'}` : '-'}
                                </p>
                                <p className="text-xs text-muted-foreground">样本数: {data?.count || 0}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid gap-4 mb-4 md:grid-cols-2">
                {metrics.slice(0, 2).map(name => (
                    <Card key={name}>
                        <CardHeader>
                            <CardTitle>{metricDescriptions[name]?.title} - 分布</CardTitle>
                            <CardDescription>性能指标分布直方图</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                className="w-full h-64"
                                config={{
                                    count: {
                                        color: 'hsl(var(--chart-3))',
                                    },
                                }}
                            >
                                <BarChart data={distributionData(name)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>性能指标详细数据</CardTitle>
                    <CardDescription>百分位数统计</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>指标</TableHead>
                                <TableHead>平均值</TableHead>
                                <TableHead>P50</TableHead>
                                <TableHead>P75</TableHead>
                                <TableHead>P95</TableHead>
                                <TableHead>P99</TableHead>
                                <TableHead>样本数</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4">
                                        加载中...
                                    </TableCell>
                                </TableRow>
                            ) : metricsData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4">
                                        暂无数据
                                    </TableCell>
                                </TableRow>
                            ) : (
                                metricsData.map(data => (
                                    <TableRow key={data.name}>
                                        <TableCell className="font-medium">{data.name}</TableCell>
                                        <TableCell>
                                            {data.avg != null ? Math.round(data.avg) : '-'}
                                            {data.avg != null && data.name !== 'CLS' ? 'ms' : ''}
                                        </TableCell>
                                        <TableCell>
                                            {data.p50 != null ? Math.round(data.p50) : '-'}
                                            {data.p50 != null && data.name !== 'CLS' ? 'ms' : ''}
                                        </TableCell>
                                        <TableCell>
                                            {data.p75 != null ? Math.round(data.p75) : '-'}
                                            {data.p75 != null && data.name !== 'CLS' ? 'ms' : ''}
                                        </TableCell>
                                        <TableCell>
                                            {data.p95 != null ? Math.round(data.p95) : '-'}
                                            {data.p95 != null && data.name !== 'CLS' ? 'ms' : ''}
                                        </TableCell>
                                        <TableCell>
                                            {data.p99 != null ? Math.round(data.p99) : '-'}
                                            {data.p99 != null && data.name !== 'CLS' ? 'ms' : ''}
                                        </TableCell>
                                        <TableCell>{data.count}</TableCell>
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
