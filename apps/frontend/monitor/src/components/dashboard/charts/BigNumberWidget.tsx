import { TrendingDown, TrendingUp } from 'lucide-react'

import type { ExecuteQueryResponse } from '@/components/dashboard/types'

interface BigNumberWidgetProps {
    data: ExecuteQueryResponse
}

/**
 * 大数字组件
 */
export function BigNumberWidget({ data }: BigNumberWidgetProps) {
    const firstResult = data.results[0]
    const firstRow = firstResult?.data[0]

    if (!firstRow) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>暂无数据</p>
            </div>
        )
    }

    // 获取数值 (第一个字段或第二个字段)
    const keys = Object.keys(firstRow)
    const valueKey = keys.length > 1 ? keys[1] : keys[0]

    if (!valueKey) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>数据格式错误</p>
            </div>
        )
    }

    const value = firstRow[valueKey]

    // 格式化数字
    const formattedValue = formatNumber(value)

    // 如果有第二行数据,计算趋势
    const secondRow = firstResult?.data[1]
    let trend: 'up' | 'down' | null = null
    let trendPercent = 0

    if (secondRow && valueKey) {
        const prevValue = secondRow[valueKey]
        if (typeof value === 'number' && typeof prevValue === 'number' && prevValue !== 0) {
            const change = ((value - prevValue) / prevValue) * 100
            trendPercent = Math.abs(change)
            trend = change > 0 ? 'up' : 'down'
        }
    }

    return (
        <div className="flex h-full flex-col items-center justify-center space-y-4">
            <div className="text-center">
                <div className="text-6xl font-bold">{formattedValue}</div>
                <div className="mt-2 text-sm text-muted-foreground">{firstResult?.legend || '总计'}</div>
            </div>

            {trend && (
                <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span>{trendPercent.toFixed(1)}%</span>
                </div>
            )}
        </div>
    )
}

/**
 * 格式化数字
 */
function formatNumber(value: unknown): string {
    if (typeof value !== 'number') {
        return String(value)
    }

    // 大于 1000 的数字使用千分位
    if (value >= 1000) {
        return value.toLocaleString()
    }

    // 小数保留 2 位
    if (value % 1 !== 0) {
        return value.toFixed(2)
    }

    return String(value)
}
