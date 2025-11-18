import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ExecuteQueryResponse } from '@/types/dashboard'
import type { ChartConfig } from '@/components/ui/chart'

interface RadarChartWidgetProps {
    data: ExecuteQueryResponse
}

export function RadarChartWidget({ data }: RadarChartWidgetProps) {
    const chartData = transformData(data)

    if (chartData.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>暂无数据</p>
            </div>
        )
    }

    const chartConfig: ChartConfig = {
        value: { label: '错误数量', color: '#3b82f6' },
    }

    return (
        <ChartContainer config={chartConfig} className="h-full w-full">
            <RadarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <defs>
                    {chartData.map((item, index) => (
                        <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={item.fill} stopOpacity={0.8} />
                            <stop offset="100%" stopColor={item.fill} stopOpacity={0.3} />
                        </linearGradient>
                    ))}
                </defs>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis
                    dataKey="category"
                    tick={({ payload, x, y, textAnchor, index }) => {
                        const item = chartData[index]
                        return (
                            <text x={x} y={y} textAnchor={textAnchor} fill={item?.fill || '#94a3b8'} fontSize={11} fontWeight={500}>
                                {payload.value}
                            </text>
                        )
                    }}
                />
                <PolarRadiusAxis angle={90} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name="错误数量" dataKey="value" stroke="#3b82f6" fill="url(#gradient-0)" fillOpacity={1} strokeWidth={2} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            </RadarChart>
        </ChartContainer>
    )
}

interface TransformedData {
    category: string
    value: number
    fill: string
}

// 蓝色系渐变配色 (从浅到深)
const BLUE_COLORS = ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af']

function transformData(data: ExecuteQueryResponse): TransformedData[] {
    if (!data.results || data.results.length === 0) return []

    const result = data.results[0]
    if (!result || !result.data) return []

    const errorTypeMap: Record<string, string> = {
        error: 'JS Error',
        unhandledrejection: 'Promise Rejection',
        httpError: 'HTTP Error',
        resourceError: 'Resource Error',
    }

    const items = result.data
        .map(row => {
            const eventType = String(row.event_type || row.error_type || '')
            const count = Number(row.count || row.value || 0)
            const label = errorTypeMap[eventType.toLowerCase()]

            if (!label) return null

            return {
                category: label,
                value: count,
                fill: '',
            }
        })
        .filter((item): item is TransformedData => item !== null)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

    // 为每个错误类型分配颜色
    return items.map((item, index) => ({
        ...item,
        fill: BLUE_COLORS[index % BLUE_COLORS.length] || '#3b82f6',
    }))
}
