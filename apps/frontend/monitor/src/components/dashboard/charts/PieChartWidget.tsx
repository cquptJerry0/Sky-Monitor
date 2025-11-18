import { Pie, PieChart, Cell, Legend, Tooltip } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ExecuteQueryResponse } from '@/types/dashboard'
import type { ChartConfig } from '@/components/ui/chart'

interface PieChartWidgetProps {
    data: ExecuteQueryResponse
}

// 蓝色系渐变配色 (从浅到深)
const BLUE_COLORS = ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554', '#0f172a']

export function PieChartWidget({ data }: PieChartWidgetProps) {
    const chartData = transformData(data)

    if (chartData.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>暂无数据</p>
            </div>
        )
    }

    const chartConfig: ChartConfig = chartData.reduce((config, item, index) => {
        config[item.name] = {
            label: item.name,
            color: BLUE_COLORS[index % BLUE_COLORS.length],
        }
        return config
    }, {} as ChartConfig)

    return (
        <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BLUE_COLORS[index % BLUE_COLORS.length]} />
                    ))}
                </Pie>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Legend />
            </PieChart>
        </ChartContainer>
    )
}

interface TransformedData {
    name: string
    value: number
}

function transformData(data: ExecuteQueryResponse): TransformedData[] {
    if (!data.results || data.results.length === 0) return []

    const result = data.results[0]
    if (!result || !result.data) return []

    return result.data
        .map(row => {
            const name = String(row.event_type || row.name || row.category || '')
            const value = Number(row.count || row.value || 0)

            if (!name || value === 0) return null

            return { name, value }
        })
        .filter((item): item is TransformedData => item !== null)
        .sort((a, b) => b.value - a.value)
}
