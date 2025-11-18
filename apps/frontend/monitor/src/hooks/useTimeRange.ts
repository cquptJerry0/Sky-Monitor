import { useMemo } from 'react'
import { format, differenceInHours } from 'date-fns'
import type { QueryResultDataPoint } from '@/types/dashboard'

interface TimeRangeConfig {
    ticks: string[]
    format: string
    hoursDiff: number
}

/**
 * 通用时间跨度处理 Hook
 * 根据数据的时间范围自动计算刻度间隔和格式
 */
export function useTimeRange(data: QueryResultDataPoint[]): TimeRangeConfig {
    return useMemo(() => {
        if (data.length === 0) {
            return { ticks: [], format: 'HH:mm', hoursDiff: 0 }
        }

        const firstName = data[0]?.name
        const lastName = data[data.length - 1]?.name
        if (!firstName || !lastName) {
            return { ticks: [], format: 'HH:mm', hoursDiff: 0 }
        }

        const firstTime = new Date(firstName as string)
        const lastTime = new Date(lastName as string)
        const hoursDiff = differenceInHours(lastTime, firstTime)

        let tickCount: number
        let dateFormat: string

        // 根据时间跨度决定刻度数量和格式
        if (hoursDiff <= 6) {
            // 6小时内: 显示所有刻度, HH:mm
            tickCount = data.length
            dateFormat = 'HH:mm'
        } else if (hoursDiff <= 48) {
            // 2天内: 显示约8个刻度, MM-dd HH:mm
            tickCount = 8
            dateFormat = 'MM-dd HH:mm'
        } else if (hoursDiff <= 168) {
            // 7天内: 显示约7个刻度, MM-dd
            tickCount = 7
            dateFormat = 'MM-dd'
        } else {
            // 7天以上: 显示约10个刻度, MM-dd
            tickCount = 10
            dateFormat = 'MM-dd'
        }

        // 计算刻度间隔
        const step = Math.max(1, Math.floor(data.length / tickCount))
        const ticks: string[] = []

        for (let i = 0; i < data.length; i += step) {
            const name = data[i]?.name
            if (name) ticks.push(name as string)
        }

        // 确保最后一个时间点也显示
        if (data.length > 0 && ticks[ticks.length - 1] !== data[data.length - 1]?.name) {
            const lastName = data[data.length - 1]?.name
            if (lastName) ticks.push(lastName as string)
        }

        return { ticks, format: dateFormat, hoursDiff }
    }, [data])
}

/**
 * 格式化时间刻度
 */
export function formatTimeTick(value: string, formatStr: string): string {
    try {
        return format(new Date(value), formatStr)
    } catch {
        return value
    }
}

interface MetricStats {
    avg: number
    trend: number
}

/**
 * 计算指标统计数据
 */
export function useMetricsStats(data: QueryResultDataPoint[], metrics: string[]): Record<string, MetricStats> {
    return useMemo(() => {
        const stats: Record<string, MetricStats> = {}

        metrics.forEach(metric => {
            const values = data.map(d => (typeof d[metric] === 'number' ? d[metric] : 0)).filter(v => v > 0)

            if (values.length === 0) {
                stats[metric] = { avg: 0, trend: 0 }
                return
            }

            const avg = values.reduce((sum, v) => sum + v, 0) / values.length

            // 计算趋势: 前半段 vs 后半段
            const firstHalf = values.slice(0, Math.floor(values.length / 2))
            const secondHalf = values.slice(Math.floor(values.length / 2))
            const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length
            const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length
            const trend = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0

            stats[metric] = { avg, trend }
        })

        return stats
    }, [data, metrics])
}
