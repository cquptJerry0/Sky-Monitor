import type { Event } from '@/api/types'
import { parseEventData } from '@/utils/eventUtils'

export interface EventMessage {
    primary: string
    secondary?: string
}

export function extractEventMessage(event: Event): EventMessage {
    const eventData = parseEventData(event)

    // 错误事件 - 根据 event_name 精确判断
    if (event.event_type === 'error' || event.event_type === 'unhandledrejection') {
        // HTTP 错误
        if (event.event_name === 'http_error' || event.http) {
            return {
                primary: `HTTP ${event.http?.status} ${event.http?.method} ${event.http?.url}`,
                secondary: `${event.http?.statusText || ''} · 耗时 ${event.http?.duration}ms`,
            }
        }

        // 资源错误
        if (event.event_name === 'resource_error' || event.resource) {
            return {
                primary: `资源加载失败: ${event.resource?.url}`,
                secondary: `类型: ${event.resource?.type}`,
            }
        }

        // Promise拒绝
        if (event.event_name === 'unhandled_rejection') {
            return {
                primary: event.error_message || '未处理的Promise拒绝',
                secondary: event.error_stack ? `${event.path || ''} ${event.error_lineno}:${event.error_colno}` : undefined,
            }
        }

        // JS运行时错误 (runtime_error 或默认)
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

    // 性能事件 - 根据 event_name 区分
    if (event.event_type === 'performance') {
        const category = event.event_name || event.perf_category || event.category
        const value = event.perf_value ?? event.duration ?? event.value

        // 长任务特殊处理
        if (category === 'long_task' || category === 'longTask') {
            const taskData = eventData?.task as any
            const duration = taskData?.duration ?? value
            const displayValue = duration !== undefined ? `${Math.round(duration)}ms` : '-'

            // 提取归因信息
            let attribution = ''
            if (taskData?.attribution && Array.isArray(taskData.attribution) && taskData.attribution.length > 0) {
                const attr = taskData.attribution[0]
                if (attr?.containerSrc) {
                    attribution = ` · 来源: ${attr.containerSrc}`
                } else if (attr?.containerName) {
                    attribution = ` · 容器: ${attr.containerName}`
                }
            }

            return {
                primary: `长任务: ${displayValue}${attribution}`,
                secondary: event.path || undefined,
            }
        }

        // 格式化类别名称
        const categoryMap: Record<string, string> = {
            http_performance: 'HTTP性能',
            resource_timing: '资源性能',
            http: 'HTTP请求',
            resourceTiming: '资源加载',
            long_task: '长任务',
            longTask: '长任务',
        }
        const displayCategory = categoryMap[category || ''] || category || '性能事件'
        const displayValue = value !== undefined ? `${Math.round(value)}ms` : '-'

        return {
            primary: `${displayCategory}: ${displayValue}`,
            secondary: event.url || undefined,
        }
    }

    // Web Vitals
    if (event.event_type === 'webVital') {
        // 优先使用 event_name 和 perf_value (后端查询返回的字段)
        // 如果没有,则从 event_data 中提取
        let name = event.event_name
        let value = event.perf_value
        let rating = event.perf_rating || (eventData?.rating as string)

        // 如果后端字段为空,从 event_data 提取
        if (!name && eventData?.name) {
            name = eventData.name as string
        }
        if ((value === undefined || value === 0) && eventData?.value !== undefined) {
            value = eventData.value as number
        }

        // 如果还是没有数据,尝试显示原始 event_data
        if (!name && !value) {
            return {
                primary: 'Web Vitals 指标',
                secondary: JSON.stringify(eventData || {}),
            }
        }

        // 格式化数值显示
        let displayValue: string
        if (name === 'CLS') {
            // CLS 是无单位的分数
            displayValue = value?.toFixed(3) || '0.000'
        } else {
            // LCP, FCP, TTFB, FID, INP 等都是毫秒
            displayValue = value ? `${Math.round(value)}ms` : '0ms'
        }

        return {
            primary: `${name || 'Unknown'}: ${displayValue}`,
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
            primary: event.error_message || (eventData.message as string) || '日志消息',
            secondary: event.event_level ? `级别: ${event.event_level}` : undefined,
        }
    }

    // Custom 或其他事件
    return {
        primary: event.event_name || event.event_type,
        secondary: eventData.description as string,
    }
}
