import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { format, differenceInHours } from 'date-fns'
import { useState } from 'react'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ExecuteQueryResponse, QueryResultDataPoint } from '@/types/dashboard'
import type { ChartConfig } from '@/components/ui/chart'

interface WebVitalsChartWidgetProps {
    data: ExecuteQueryResponse
}

const PERFORMANCE_THRESHOLDS = {
    lcp: { good: 2500, poor: 4000 },
    fcp: { good: 1800, poor: 3000 },
    ttfb: { good: 800, poor: 1800 },
    inp: { good: 200, poor: 500 },
}

export function WebVitalsChartWidget({ data }: WebVitalsChartWidgetProps) {
    const [hiddenMetrics, setHiddenMetrics] = useState<Set<string>>(new Set())
    const [hoveredMetric, setHoveredMetric] = useState<string | null>(null)

    const chartData = transformData(data)

    if (chartData.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>暂无数据</p>
            </div>
        )
    }

    const chartConfig: ChartConfig = {
        ttfb: { label: 'TTFB', color: '#60a5fa' },
        inp: { label: 'INP', color: '#3b82f6' },
        fcp: { label: 'FCP', color: '#2563eb' },
        lcp: { label: 'LCP', color: '#1d4ed8' },
    }

    const availableMetrics = extractAvailableMetrics(data)
    const tickConfig = calculateTickInterval(chartData)
    const metricsStats = calculateMetricsStats(chartData, availableMetrics)
    const performanceScore = calculatePerformanceScore(metricsStats)

    const handleLegendClick = (metric: string) => {
        setHiddenMetrics(prev => {
            const newSet = new Set(prev)
            if (newSet.has(metric)) {
                newSet.delete(metric)
            } else {
                newSet.add(metric)
            }
            return newSet
        })
    }

    return (
        <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart
                data={chartData}
                margin={{ top: 10, right: 50, left: 0, bottom: 0 }}
                onMouseMove={e => {
                    if (e && e.activePayload) {
                        const dataKey = e.activePayload[0]?.dataKey
                        if (dataKey) setHoveredMetric(dataKey as string)
                    }
                }}
                onMouseLeave={() => setHoveredMetric(null)}
            >
                <defs>
                    {availableMetrics.map(metric => (
                        <linearGradient key={metric} id={`fill${metric}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={`var(--color-${metric})`} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={`var(--color-${metric})`} stopOpacity={0.1} />
                        </linearGradient>
                    ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    ticks={tickConfig.ticks}
                    tickFormatter={value => {
                        try {
                            return format(new Date(value), tickConfig.format)
                        } catch {
                            return value
                        }
                    }}
                />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={value => `${value}ms`} />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={value => `${value}ms`}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Legend
                    content={
                        <CustomLegend
                            stats={metricsStats}
                            onLegendClick={handleLegendClick}
                            hiddenMetrics={hiddenMetrics}
                            performanceScore={performanceScore}
                        />
                    }
                />

                {availableMetrics.includes('lcp') && !hiddenMetrics.has('lcp') && (
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="lcp"
                        stroke="var(--color-lcp)"
                        fill="url(#filllcp)"
                        fillOpacity={hoveredMetric === 'lcp' || !hoveredMetric ? 0.4 : 0.1}
                        strokeWidth={hoveredMetric === 'lcp' || !hoveredMetric ? 2 : 1}
                        strokeOpacity={hoveredMetric === 'lcp' || !hoveredMetric ? 1 : 0.3}
                    />
                )}
                {availableMetrics.includes('fcp') && !hiddenMetrics.has('fcp') && (
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="fcp"
                        stroke="var(--color-fcp)"
                        fill="url(#fillfcp)"
                        fillOpacity={hoveredMetric === 'fcp' || !hoveredMetric ? 0.4 : 0.1}
                        strokeWidth={hoveredMetric === 'fcp' || !hoveredMetric ? 2 : 1}
                        strokeOpacity={hoveredMetric === 'fcp' || !hoveredMetric ? 1 : 0.3}
                    />
                )}
                {availableMetrics.includes('ttfb') && !hiddenMetrics.has('ttfb') && (
                    <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="ttfb"
                        stroke="var(--color-ttfb)"
                        fill="url(#fillttfb)"
                        fillOpacity={hoveredMetric === 'ttfb' || !hoveredMetric ? 0.4 : 0.1}
                        strokeWidth={hoveredMetric === 'ttfb' || !hoveredMetric ? 2 : 1}
                        strokeOpacity={hoveredMetric === 'ttfb' || !hoveredMetric ? 1 : 0.3}
                    />
                )}
                {availableMetrics.includes('inp') && !hiddenMetrics.has('inp') && (
                    <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="inp"
                        stroke="var(--color-inp)"
                        fill="url(#fillinp)"
                        fillOpacity={hoveredMetric === 'inp' || !hoveredMetric ? 0.4 : 0.1}
                        strokeWidth={hoveredMetric === 'inp' || !hoveredMetric ? 2 : 1}
                        strokeOpacity={hoveredMetric === 'inp' || !hoveredMetric ? 1 : 0.3}
                    />
                )}
            </AreaChart>
        </ChartContainer>
    )
}

function extractAvailableMetrics(data: ExecuteQueryResponse): string[] {
    const metrics: string[] = []
    data.results.forEach(result => {
        const legend = result.legend?.toLowerCase() || ''
        if (legend.includes('lcp')) metrics.push('lcp')
        else if (legend.includes('fcp')) metrics.push('fcp')
        else if (legend.includes('ttfb')) metrics.push('ttfb')
        else if (legend.includes('inp')) metrics.push('inp')
    })
    return metrics
}

function transformData(data: ExecuteQueryResponse): QueryResultDataPoint[] {
    if (!data.results || data.results.length === 0) return []

    const mergedData = new Map<string, QueryResultDataPoint>()

    data.results.forEach(result => {
        if (!result) return
        const metricKey = extractMetricKey(result.legend || result.queryId)

        result.data.forEach(row => {
            const keys = Object.keys(row)
            const xKey = keys[0]
            const yKey = keys[1] || keys[0]
            if (!xKey || !yKey) return

            const xValue = String(row[xKey])
            if (!mergedData.has(xValue)) {
                mergedData.set(xValue, { name: xValue })
            }

            const point = mergedData.get(xValue)
            if (point) point[metricKey] = row[yKey]
        })
    })

    const result = Array.from(mergedData.values()).sort((a, b) => {
        const timeA = new Date(a.name as string).getTime()
        const timeB = new Date(b.name as string).getTime()
        return timeA - timeB
    })

    return result
}

function extractMetricKey(legend: string): string {
    const lower = legend.toLowerCase()
    if (lower.includes('lcp')) return 'lcp'
    if (lower.includes('fcp')) return 'fcp'
    if (lower.includes('ttfb')) return 'ttfb'
    if (lower.includes('inp')) return 'inp'
    return legend
}

function calculateTickInterval(data: QueryResultDataPoint[]): { ticks: string[]; format: string } {
    if (data.length === 0) return { ticks: [], format: 'HH:mm' }

    const firstName = data[0]?.name
    const lastName = data[data.length - 1]?.name
    if (!firstName || !lastName) return { ticks: [], format: 'HH:mm' }

    const firstTime = new Date(firstName as string)
    const lastTime = new Date(lastName as string)
    const hoursDiff = differenceInHours(lastTime, firstTime)

    let tickCount: number
    let format: string

    if (hoursDiff <= 6) {
        tickCount = data.length
        format = 'HH:mm'
    } else if (hoursDiff <= 48) {
        tickCount = 8
        format = 'MM-dd HH:mm'
    } else if (hoursDiff <= 168) {
        tickCount = 7
        format = 'MM-dd'
    } else {
        tickCount = 10
        format = 'MM-dd'
    }

    const step = Math.max(1, Math.floor(data.length / tickCount))
    const ticks: string[] = []
    for (let i = 0; i < data.length; i += step) {
        const name = data[i]?.name
        if (name) ticks.push(name as string)
    }

    if (data.length > 0 && ticks[ticks.length - 1] !== data[data.length - 1]?.name) {
        const lastName = data[data.length - 1]?.name
        if (lastName) ticks.push(lastName as string)
    }

    console.log('[WebVitals] hoursDiff:', hoursDiff, 'tickCount:', tickCount, 'step:', step, 'ticks.length:', ticks.length)

    return { ticks, format }
}

interface MetricStats {
    avg: number
    trend: number
}

function calculateMetricsStats(data: QueryResultDataPoint[], metrics: string[]): Record<string, MetricStats> {
    const stats: Record<string, MetricStats> = {}

    metrics.forEach(metric => {
        const values = data.map(d => (typeof d[metric] === 'number' ? d[metric] : 0)).filter(v => v > 0)
        if (values.length === 0) {
            stats[metric] = { avg: 0, trend: 0 }
            return
        }

        const avg = values.reduce((sum, v) => sum + v, 0) / values.length
        const firstHalf = values.slice(0, Math.floor(values.length / 2))
        const secondHalf = values.slice(Math.floor(values.length / 2))
        const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length
        const trend = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0

        stats[metric] = { avg, trend }
    })

    return stats
}

function calculatePerformanceScore(stats: Record<string, MetricStats>): { score: number; grade: string; color: string } {
    let totalScore = 0
    let count = 0

    Object.entries(stats).forEach(([metric, stat]) => {
        const thresholds = PERFORMANCE_THRESHOLDS[metric as keyof typeof PERFORMANCE_THRESHOLDS]
        if (!thresholds) return

        let score = 0
        if (stat.avg <= thresholds.good) {
            score = 100
        } else if (stat.avg <= thresholds.poor) {
            const range = thresholds.poor - thresholds.good
            const position = stat.avg - thresholds.good
            score = 100 - (position / range) * 50
        } else {
            score = 50 - Math.min(50, ((stat.avg - thresholds.poor) / thresholds.poor) * 50)
        }

        totalScore += score
        count++
    })

    const avgScore = count > 0 ? totalScore / count : 0
    let grade = 'Poor'
    let color = '#ef4444'

    if (avgScore >= 90) {
        grade = 'Good'
        color = '#22c55e'
    } else if (avgScore >= 50) {
        grade = 'Needs Improvement'
        color = '#f59e0b'
    }

    return { score: Math.round(avgScore), grade, color }
}

interface CustomLegendProps {
    stats: Record<string, MetricStats>
    onLegendClick: (metric: string) => void
    hiddenMetrics: Set<string>
    performanceScore: { score: number; grade: string; color: string }
}

function CustomLegend({ stats, onLegendClick, hiddenMetrics, performanceScore }: CustomLegendProps) {
    const metrics = [
        { key: 'ttfb', label: 'TTFB', color: '#60a5fa' },
        { key: 'inp', label: 'INP', color: '#3b82f6' },
        { key: 'fcp', label: 'FCP', color: '#2563eb' },
        { key: 'lcp', label: 'LCP', color: '#1d4ed8' },
    ]

    return (
        <div className="flex flex-col gap-3 pt-4">
            <div className="flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">性能评分</span>
                    <span className="text-lg font-bold" style={{ color: performanceScore.color }}>
                        {performanceScore.score}
                    </span>
                    <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: performanceScore.color + '20', color: performanceScore.color }}
                    >
                        {performanceScore.grade}
                    </span>
                </div>
                {metrics.map(({ key, label, color }) => {
                    const stat = stats[key]
                    if (!stat) return null

                    const isHidden = hiddenMetrics.has(key)
                    const trendIcon = stat.trend > 0 ? '↑' : stat.trend < 0 ? '↓' : '→'
                    const trendColor = stat.trend > 0 ? 'text-red-500' : stat.trend < 0 ? 'text-green-500' : 'text-gray-500'

                    return (
                        <button
                            key={key}
                            onClick={() => onLegendClick(key)}
                            className={`flex items-center gap-2 text-sm ${isHidden ? 'opacity-40' : 'opacity-100'}`}
                        >
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            <span className="font-medium">{label}</span>
                            <span className="text-muted-foreground">{Math.round(stat.avg)}ms</span>
                            <span className={`${trendColor} font-medium`}>
                                {trendIcon} {Math.abs(Math.round(stat.trend))}%
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
