/**
 * 图表数据转换工具函数
 */

import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { ErrorTrend } from '@/api/types'

/**
 * 转换错误趋势数据为图表数据
 * @param trends - 错误趋势数组
 * @returns 图表数据数组
 */
export function transformTrendData(trends: ErrorTrend[]) {
    return trends.map(trend => ({
        time: new Date(trend.time_bucket).getTime(),
        count: trend.count,
        occurrences: trend.total_occurrences,
        label: format(new Date(trend.time_bucket), 'HH:mm', { locale: zhCN }),
    }))
}

/**
 * 转换多个错误趋势数据为对比图表数据
 * @param trendsMap - 错误趋势映射 { fingerprint: trends[] }
 * @returns 图表数据数组
 */
export function transformCompareTrendData(trendsMap: Record<string, ErrorTrend[]>) {
    const allTimestamps = new Set<number>()

    // 收集所有时间戳
    Object.values(trendsMap).forEach(trends => {
        trends.forEach(trend => {
            allTimestamps.add(new Date(trend.time_bucket).getTime())
        })
    })

    // 排序时间戳
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)

    // 构建图表数据
    return sortedTimestamps.map(timestamp => {
        const dataPoint: any = {
            time: timestamp,
            label: format(new Date(timestamp), 'HH:mm', { locale: zhCN }),
        }

        // 为每个 fingerprint 添加数据
        Object.entries(trendsMap).forEach(([fingerprint, trends]) => {
            const trend = trends.find(t => new Date(t.time_bucket).getTime() === timestamp)
            dataPoint[fingerprint] = trend ? trend.count : 0
        })

        return dataPoint
    })
}

/**
 * 计算趋势数据的统计信息
 * @param trends - 错误趋势数组
 * @returns 统计信息
 */
export function calculateTrendStats(trends: ErrorTrend[]) {
    if (trends.length === 0) {
        return {
            total: 0,
            avg: 0,
            max: 0,
            min: 0,
            latest: 0,
        }
    }

    const counts = trends.map(t => t.count)
    const total = counts.reduce((sum, count) => sum + count, 0)
    const avg = total / counts.length
    const max = Math.max(...counts)
    const min = Math.min(...counts)
    const latest = counts[counts.length - 1] || 0

    return {
        total,
        avg: Math.round(avg),
        max,
        min,
        latest,
    }
}

/**
 * 填充缺失的时间点数据
 * @param trends - 错误趋势数组
 * @param window - 时间窗口（hour, day, week）
 * @returns 填充后的趋势数组
 */
export function fillMissingTimePoints(trends: ErrorTrend[], window: 'hour' | 'day' | 'week'): ErrorTrend[] {
    if (trends.length === 0) return []

    // 确定时间间隔（毫秒）
    const intervalMs = window === 'hour' ? 5 * 60 * 1000 : 60 * 60 * 1000

    const sortedTrends = [...trends].sort((a, b) => new Date(a.time_bucket).getTime() - new Date(b.time_bucket).getTime())

    const firstTrend = sortedTrends[0]
    const lastTrend = sortedTrends[sortedTrends.length - 1]

    if (!firstTrend || !lastTrend) return []

    const firstTime = new Date(firstTrend.time_bucket).getTime()
    const lastTime = new Date(lastTrend.time_bucket).getTime()

    const filled: ErrorTrend[] = []
    const trendMap = new Map(sortedTrends.map(t => [new Date(t.time_bucket).getTime(), t]))

    for (let time = firstTime; time <= lastTime; time += intervalMs) {
        const existing = trendMap.get(time)
        if (existing) {
            filled.push(existing)
        } else {
            filled.push({
                time_bucket: new Date(time).toISOString(),
                count: 0,
                total_occurrences: 0,
            })
        }
    }

    return filled
}

/**
 * 计算增长率
 * @param current - 当前值
 * @param previous - 之前值
 * @returns 增长率（百分比）
 */
export function calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) {
        return current > 0 ? 100 : 0
    }
    return ((current - previous) / previous) * 100
}

/**
 * 格式化增长率
 * @param rate - 增长率
 * @returns 格式化后的字符串，如 "+15.5%" 或 "-8.2%"
 */
export function formatGrowthRate(rate: number): string {
    const sign = rate >= 0 ? '+' : ''
    return `${sign}${rate.toFixed(1)}%`
}

/**
 * 计算移动平均
 * @param data - 数据数组
 * @param window - 窗口大小
 * @returns 移动平均数组
 */
export function calculateMovingAverage(data: number[], window: number): number[] {
    if (data.length < window) return data

    const result: number[] = []
    for (let i = 0; i < data.length; i++) {
        const value = data[i]
        if (value === undefined) continue

        if (i < window - 1) {
            result.push(value)
        } else {
            const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0)
            result.push(sum / window)
        }
    }
    return result
}

/**
 * 检测异常值（使用 IQR 方法）
 * @param data - 数据数组
 * @returns 异常值索引数组
 */
export function detectOutliers(data: number[]): number[] {
    if (data.length < 4) return []

    const sorted = [...data].sort((a, b) => a - b)
    const q1Index = Math.floor(sorted.length * 0.25)
    const q3Index = Math.floor(sorted.length * 0.75)

    const q1 = sorted[q1Index]
    const q3 = sorted[q3Index]

    if (q1 === undefined || q3 === undefined) return []

    const iqr = q3 - q1

    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr

    const outlierIndices: number[] = []
    data.forEach((value, index) => {
        if (value < lowerBound || value > upperBound) {
            outlierIndices.push(index)
        }
    })

    return outlierIndices
}

/**
 * 格式化大数字（K, M, B）
 * @param num - 数字
 * @returns 格式化后的字符串，如 "1.5K" 或 "2.3M"
 */
export function formatLargeNumber(num: number): string {
    if (num >= 1_000_000_000) {
        return `${(num / 1_000_000_000).toFixed(1)}B`
    }
    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`
    }
    if (num >= 1_000) {
        return `${(num / 1_000).toFixed(1)}K`
    }
    return num.toString()
}

/**
 * 格式化百分比
 * @param value - 值
 * @param total - 总数
 * @param decimals - 小数位数
 * @returns 格式化后的百分比字符串，如 "15.5%"
 */
export function formatPercentage(value: number, total: number, decimals: number = 1): string {
    if (total === 0) return '0%'
    const percentage = (value / total) * 100
    return `${percentage.toFixed(decimals)}%`
}

/**
 * 生成图表颜色数组
 * @param count - 颜色数量
 * @returns 颜色数组
 */
export function generateChartColors(count: number): string[] {
    const baseColors = [
        '#6a5acd', // primary
        '#10b981', // success
        '#f59e0b', // warning
        '#ef4444', // error
        '#3b82f6', // info
        '#8b5cf6', // purple
        '#ec4899', // pink
        '#14b8a6', // teal
    ]

    if (count <= baseColors.length) {
        return baseColors.slice(0, count)
    }

    // 如果需要更多颜色，生成渐变色
    const colors: string[] = [...baseColors]
    while (colors.length < count) {
        const hue = (colors.length * 137.5) % 360
        colors.push(`hsl(${hue}, 70%, 60%)`)
    }

    return colors
}

/**
 * 计算图表 Y 轴范围
 * @param data - 数据数组
 * @param padding - 填充比例（默认 0.1）
 * @returns { min: number, max: number }
 */
export function calculateYAxisRange(data: number[], padding: number = 0.1): { min: number; max: number } {
    if (data.length === 0) {
        return { min: 0, max: 100 }
    }

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min

    return {
        min: Math.max(0, min - range * padding),
        max: max + range * padding,
    }
}

/**
 * 格式化图表 Tooltip 值
 * @param value - 值
 * @param type - 类型（count, duration, percentage）
 * @returns 格式化后的字符串
 */
export function formatTooltipValue(value: number, type: 'count' | 'duration' | 'percentage' = 'count'): string {
    switch (type) {
        case 'count':
            return formatLargeNumber(value)
        case 'duration':
            return `${value.toFixed(2)}ms`
        case 'percentage':
            return `${value.toFixed(1)}%`
        default:
            return value.toString()
    }
}

/**
 * 聚合时间序列数据
 * @param data - 原始数据数组
 * @param bucketSize - 聚合桶大小（毫秒）
 * @returns 聚合后的数据数组
 */
export function aggregateTimeSeries(
    data: Array<{ time: number; value: number }>,
    bucketSize: number
): Array<{ time: number; value: number; count: number }> {
    if (data.length === 0) return []

    const buckets = new Map<number, { sum: number; count: number }>()

    data.forEach(({ time, value }) => {
        const bucketTime = Math.floor(time / bucketSize) * bucketSize
        const existing = buckets.get(bucketTime) || { sum: 0, count: 0 }
        buckets.set(bucketTime, {
            sum: existing.sum + value,
            count: existing.count + 1,
        })
    })

    return Array.from(buckets.entries())
        .map(([time, { sum, count }]) => ({
            time,
            value: sum / count,
            count,
        }))
        .sort((a, b) => a.time - b.time)
}
