/**
 * JSON 解析工具函数
 *
 * 用于安全地解析可能包含控制字符的 JSON 字符串
 */

/**
 * 安全的 JSON 解析，处理控制字符
 *
 * @param data - 要解析的数据（字符串或对象）
 * @param fallback - 解析失败时的默认值
 * @returns 解析后的对象或 fallback
 *
 * @example
 * ```typescript
 * const data = safeJsonParse('{"name":"test"}', {})
 * const data2 = safeJsonParse(existingObject, {})
 * ```
 */
export const safeJsonParse = <T = any>(data: string | object, fallback: T | null = null): T | null => {
    // 如果已经是对象，直接返回
    if (typeof data !== 'string') {
        return data as T
    }

    // 如果是空字符串，返回 fallback
    if (!data || data.trim() === '') {
        return fallback
    }

    try {
        // 清理控制字符（ASCII 0-31 和 127-159）
        // 这些字符在 JSON 字符串中是非法的
        // eslint-disable-next-line no-control-regex
        const cleaned = data.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        return JSON.parse(cleaned) as T
    } catch (error) {
        console.error('[JSON Parse Error]', {
            error,
            dataPreview: data.substring(0, 200), // 只打印前 200 个字符
        })
        return fallback
    }
}

/**
 * 批量解析事件数据
 *
 * @param event - 包含 event_data 字段的事件对象
 * @returns 解析后的事件对象
 *
 * @example
 * ```typescript
 * const event = { id: '1', event_data: '{"message":"error"}' }
 * const parsed = parseEventData(event)
 * // parsed.event_data 现在是对象 { message: "error" }
 * ```
 */
export const parseEventData = (event: any) => {
    return {
        ...event,
        event_data: safeJsonParse(event.event_data, {}),
    }
}

/**
 * 批量解析事件数组
 *
 * @param events - 事件数组
 * @returns 解析后的事件数组
 */
export const parseEventDataArray = (events: any[]): any[] => {
    if (!Array.isArray(events)) {
        return []
    }
    return events.map(parseEventData)
}
