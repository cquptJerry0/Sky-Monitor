/**
 * 日期格式化工具函数
 */

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * 格式化日期时间为标准格式
 * @param date - 日期字符串或 Date 对象
 * @returns 格式化后的日期时间字符串，如 "2024-01-15 14:30:45"
 */
export function formatDateTime(date: string | Date | number): string {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
        if (!isValid(dateObj)) {
            return '-'
        }
        return format(dateObj, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
    } catch (error) {
        console.error('formatDateTime error:', error)
        return '-'
    }
}

/**
 * 格式化日期为短格式
 * @param date - 日期字符串或 Date 对象
 * @returns 格式化后的日期字符串，如 "2024-01-15"
 */
export function formatDate(date: string | Date | number): string {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
        if (!isValid(dateObj)) {
            return '-'
        }
        return format(dateObj, 'yyyy-MM-dd', { locale: zhCN })
    } catch (error) {
        console.error('formatDate error:', error)
        return '-'
    }
}

/**
 * 格式化时间为短格式
 * @param date - 日期字符串或 Date 对象
 * @returns 格式化后的时间字符串，如 "14:30:45"
 */
export function formatTime(date: string | Date | number): string {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
        if (!isValid(dateObj)) {
            return '-'
        }
        return format(dateObj, 'HH:mm:ss', { locale: zhCN })
    } catch (error) {
        console.error('formatTime error:', error)
        return '-'
    }
}

/**
 * 格式化相对时间
 * @param date - 日期字符串或 Date 对象
 * @returns 相对时间字符串，如 "3 分钟前"
 */
export function formatRelativeTime(date: string | Date | number): string {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
        if (!isValid(dateObj)) {
            return '-'
        }
        return formatDistanceToNow(dateObj, { addSuffix: true, locale: zhCN })
    } catch (error) {
        console.error('formatRelativeTime error:', error)
        return '-'
    }
}

/**
 * 格式化时长（毫秒）
 * @param ms - 毫秒数
 * @returns 格式化后的时长字符串，如 "1h 23m 45s"
 */
export function formatDuration(ms: number): string {
    if (ms < 0) return '-'

    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`
    }
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`
    }
    if (seconds > 0) {
        return `${seconds}s`
    }
    return `${ms}ms`
}

/**
 * 格式化时长为简短格式（毫秒）
 * @param ms - 毫秒数
 * @returns 格式化后的时长字符串，如 "1.5h" 或 "45m"
 */
export function formatDurationShort(ms: number): string {
    if (ms < 0) return '-'

    const seconds = ms / 1000
    const minutes = seconds / 60
    const hours = minutes / 60
    const days = hours / 24

    if (days >= 1) {
        return `${days.toFixed(1)}d`
    }
    if (hours >= 1) {
        return `${hours.toFixed(1)}h`
    }
    if (minutes >= 1) {
        return `${minutes.toFixed(1)}m`
    }
    if (seconds >= 1) {
        return `${seconds.toFixed(1)}s`
    }
    return `${ms}ms`
}

/**
 * 格式化时间戳为图表标签
 * @param timestamp - 时间戳（毫秒）
 * @param granularity - 粒度（hour, day, week）
 * @returns 格式化后的标签字符串
 */
export function formatChartLabel(timestamp: number, granularity: 'hour' | 'day' | 'week' = 'hour'): string {
    try {
        const date = new Date(timestamp)
        if (!isValid(date)) {
            return '-'
        }

        switch (granularity) {
            case 'hour':
                return format(date, 'HH:mm', { locale: zhCN })
            case 'day':
                return format(date, 'MM-dd', { locale: zhCN })
            case 'week':
                return format(date, 'MM-dd', { locale: zhCN })
            default:
                return format(date, 'HH:mm', { locale: zhCN })
        }
    } catch (error) {
        console.error('formatChartLabel error:', error)
        return '-'
    }
}

/**
 * 获取时间范围
 * @param window - 时间窗口（hour, day, week）
 * @returns { start: Date, end: Date }
 */
export function getTimeRange(window: 'hour' | 'day' | 'week'): { start: Date; end: Date } {
    const end = new Date()
    const start = new Date()

    switch (window) {
        case 'hour':
            start.setHours(start.getHours() - 1)
            break
        case 'day':
            start.setDate(start.getDate() - 1)
            break
        case 'week':
            start.setDate(start.getDate() - 7)
            break
    }

    return { start, end }
}

/**
 * 格式化为 ISO 字符串（用于 API 请求）
 * @param date - 日期对象
 * @returns ISO 格式字符串
 */
export function toISOString(date: Date): string {
    return date.toISOString()
}

/**
 * 解析 ISO 字符串为 Date 对象
 * @param isoString - ISO 格式字符串
 * @returns Date 对象
 */
export function fromISOString(isoString: string): Date {
    return parseISO(isoString)
}

/**
 * 判断日期是否为今天
 * @param date - 日期字符串或 Date 对象
 * @returns 是否为今天
 */
export function isToday(date: string | Date | number): boolean {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
        if (!isValid(dateObj)) {
            return false
        }
        const today = new Date()
        return (
            dateObj.getDate() === today.getDate() &&
            dateObj.getMonth() === today.getMonth() &&
            dateObj.getFullYear() === today.getFullYear()
        )
    } catch (error) {
        return false
    }
}

/**
 * 判断日期是否为昨天
 * @param date - 日期字符串或 Date 对象
 * @returns 是否为昨天
 */
export function isYesterday(date: string | Date | number): boolean {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
        if (!isValid(dateObj)) {
            return false
        }
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        return (
            dateObj.getDate() === yesterday.getDate() &&
            dateObj.getMonth() === yesterday.getMonth() &&
            dateObj.getFullYear() === yesterday.getFullYear()
        )
    } catch (error) {
        return false
    }
}

/**
 * 格式化智能日期（今天显示时间，昨天显示"昨天"，其他显示日期）
 * @param date - 日期字符串或 Date 对象
 * @returns 格式化后的字符串
 */
export function formatSmartDate(date: string | Date | number): string {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
        if (!isValid(dateObj)) {
            return '-'
        }

        if (isToday(dateObj)) {
            return `今天 ${format(dateObj, 'HH:mm', { locale: zhCN })}`
        }
        if (isYesterday(dateObj)) {
            return `昨天 ${format(dateObj, 'HH:mm', { locale: zhCN })}`
        }
        return format(dateObj, 'MM-dd HH:mm', { locale: zhCN })
    } catch (error) {
        console.error('formatSmartDate error:', error)
        return '-'
    }
}
