import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { ExecuteQueryResponse, QueryResultDataPoint } from '@/types'

interface BarChartWidgetProps {
    data: ExecuteQueryResponse
}

// 颜色配置
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a78bfa', '#fb923c']

/**
 * 柱状图组件
 */
export function BarChartWidget({ data }: BarChartWidgetProps) {
    // 转换数据格式
    const chartData = transformData(data)

    if (chartData.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>暂无数据</p>
            </div>
        )
    }

    // 获取所有系列的字段名
    const seriesKeys = data.results.map(result => result.legend || result.queryId)

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {seriesKeys.map((key, index) => (
                    <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
                ))}
            </BarChart>
        </ResponsiveContainer>
    )
}

/**
 * 转换数据格式
 */
function transformData(data: ExecuteQueryResponse): QueryResultDataPoint[] {
    if (!data.results || data.results.length === 0) {
        return []
    }

    // 如果只有一个系列
    if (data.results.length === 1) {
        const result = data.results[0]
        if (!result) return []

        return result.data.map(row => {
            const keys = Object.keys(row)
            const xKey = keys[0]
            const yKey = keys[1] || keys[0]

            if (!xKey || !yKey) return { name: '' }

            return {
                name: String(row[xKey]),
                [result.legend || result.queryId]: row[yKey],
            }
        })
    }

    // 多个系列: 需要合并数据
    const mergedData = new Map<string, QueryResultDataPoint>()

    data.results.forEach(result => {
        if (!result) return

        const seriesName = result.legend || result.queryId

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
            if (point) {
                point[seriesName] = row[yKey]
            }
        })
    })

    return Array.from(mergedData.values())
}
