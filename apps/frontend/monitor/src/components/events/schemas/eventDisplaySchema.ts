import type { Event } from '@/api/types'
import { parseEventData } from '@/utils/eventUtils'

export interface EventMessage {
    primary: string
    secondary?: string
}

export function extractEventMessage(event: Event): EventMessage {
    const eventData = parseEventData(event)

    // 错误事件
    if (event.event_type === 'error' || event.event_type === 'unhandledrejection') {
        // HTTP 错误
        if (event.http) {
            return {
                primary: `HTTP ${event.http.status} ${event.http.method} ${event.http.url}`,
                secondary: event.http.statusText || `耗时 ${event.http.duration}ms`,
            }
        }

        // 资源错误
        if (event.resource) {
            return {
                primary: `资源加载失败: ${event.resource.url}`,
                secondary: `类型: ${event.resource.type}`,
            }
        }

        // 普通 JS 错误
        if (event.error_message) {
            return {
                primary: event.error_message,
                secondary: event.error_stack ? `${event.path || ''} ${event.error_lineno}:${event.error_colno}` : undefined,
            }
        }

        return {
            primary: (eventData.message as string) || '未知错误',
        }
    }

    // 性能事件
    if (event.event_type === 'performance') {
        // HTTP 性能
        if (event.category === 'http') {
            const status = event.status ? `[${event.status}]` : ''
            const slow = event.is_slow ? '[慢请求]' : ''
            return {
                primary: `${status}${slow} ${event.method} ${event.url}`,
                secondary: `耗时 ${event.duration}ms`,
            }
        }

        // 资源性能
        if (event.category === 'resourceTiming') {
            return {
                primary: `资源加载: ${event.url}`,
                secondary: `耗时 ${event.duration}ms`,
            }
        }

        return {
            primary: (eventData.name as string) || '性能事件',
            secondary: eventData.value ? `值: ${eventData.value}` : undefined,
        }
    }

    // Web Vitals
    if (event.event_type === 'webVital') {
        // 优先使用 event_name 和 perf_value (后端查询返回的字段)
        // 如果没有,则从 event_data 中提取
        const name = event.event_name || (eventData.name as string)
        const value = event.perf_value !== undefined && event.perf_value !== 0 ? event.perf_value : (eventData.value as number)
        const rating = eventData.rating as string

        if (!name || value === undefined || value === null) {
            return {
                primary: 'Web Vitals 指标',
                secondary: '数据不完整',
            }
        }

        // 格式化数值显示
        let displayValue: string
        if (name === 'CLS') {
            // CLS 是无单位的分数
            displayValue = value.toFixed(3)
        } else {
            // LCP, FCP, TTFB, FID, INP 等都是毫秒
            displayValue = `${Math.round(value)}ms`
        }

        return {
            primary: `${name}: ${displayValue}`,
            secondary: rating ? `评级: ${rating}` : undefined,
        }
    }

    // 会话事件
    if (event.event_type === 'session') {
        return {
            primary: `会话统计`,
            secondary: `事件数: ${event.session_event_count || 0}, 错误数: ${event.session_error_count || 0}`,
        }
    }

    // 消息事件
    if (event.event_type === 'message') {
        return {
            primary: (eventData.message as string) || '日志消息',
            secondary: event.event_level ? `级别: ${event.event_level}` : undefined,
        }
    }

    // Custom 或其他事件
    return {
        primary: event.event_name || event.event_type,
        secondary: eventData.description as string,
    }
}
