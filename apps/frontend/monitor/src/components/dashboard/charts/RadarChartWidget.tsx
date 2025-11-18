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
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name="错误数量" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} strokeWidth={2} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            </RadarChart>
        </ChartContainer>
    )
}

interface TransformedData {
    category: string
    value: number
}

function transformData(data: ExecuteQueryResponse): TransformedData[] {
    if (!data.results || data.results.length === 0) return []

    const result = data.results[0]
    if (!result || !result.data) return []

    const errorTypeMap: Record<string, string> = {
        error: 'JS Error',
        exception: 'Exception',
        unhandledrejection: 'Promise',
        network: 'Network',
        timeout: 'Timeout',
    }

    return result.data
        .map(row => {
            const eventType = String(row.event_type || row.error_type || '')
            const count = Number(row.count || row.value || 0)
            const label = errorTypeMap[eventType.toLowerCase()]

            if (!label) return null

            return {
                category: label,
                value: count,
            }
        })
        .filter((item): item is TransformedData => item !== null)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5) // 只显示前5个
}
