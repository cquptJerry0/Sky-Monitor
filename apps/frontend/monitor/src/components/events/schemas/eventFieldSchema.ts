import type { Event } from '@/api/types'

export type FieldType = 'text' | 'code' | 'json' | 'link' | 'duration' | 'timestamp' | 'badge' | 'number'

export interface DetailField {
    label: string
    key: string
    type: FieldType
    condition?: (event: Event) => boolean
    extract?: (event: Event) => unknown
}

export const commonFields: DetailField[] = [
    { label: '事件ID', key: 'id', type: 'text' },
    { label: '应用ID', key: 'app_id', type: 'text' },
    { label: '事件类型', key: 'event_type', type: 'badge' },
    { label: '事件名称', key: 'event_name', type: 'badge' },
    { label: '时间', key: 'timestamp', type: 'timestamp' },
    { label: '创建时间', key: 'created_at', type: 'timestamp' },
    { label: '页面路径', key: 'path', type: 'text' },
    { label: 'User Agent', key: 'user_agent', type: 'text' },
    { label: '事件级别', key: 'event_level', type: 'badge' },
    { label: '环境', key: 'environment', type: 'badge' },
    { label: '版本号', key: 'release', type: 'text' },
]

export const errorFields: DetailField[] = [
    { label: '错误消息', key: 'error_message', type: 'text' },
    {
        label: 'SourceMap 状态',
        key: 'sourceMapStatus',
        type: 'badge',
        condition: e => !!e.sourceMapStatus,
    },
    {
        label: '解析后的堆栈',
        key: 'parsedStack',
        type: 'code',
        condition: e => !!e.parsedStack,
    },
    {
        label: '原始堆栈',
        key: 'error_stack',
        type: 'code',
        condition: e => !e.parsedStack && !!e.error_stack,
    },
    { label: '行号', key: 'error_lineno', type: 'number' },
    { label: '列号', key: 'error_colno', type: 'number' },
    { label: '错误指纹', key: 'error_fingerprint', type: 'text' },
]

export const httpErrorFields: DetailField[] = [
    {
        label: 'URL',
        key: 'http.url',
        type: 'link',
        extract: e => e.http?.url,
    },
    {
        label: '请求方法',
        key: 'http.method',
        type: 'badge',
        extract: e => e.http?.method,
    },
    {
        label: '状态码',
        key: 'http.status',
        type: 'badge',
        extract: e => e.http?.status,
    },
    {
        label: '状态文本',
        key: 'http.statusText',
        type: 'text',
        extract: e => e.http?.statusText,
    },
    {
        label: '耗时',
        key: 'http.duration',
        type: 'duration',
        extract: e => e.http?.duration,
    },
    {
        label: '请求头',
        key: 'http.requestHeaders',
        type: 'json',
        extract: e => e.http?.requestHeaders,
    },
    {
        label: '响应头',
        key: 'http.responseHeaders',
        type: 'json',
        extract: e => e.http?.responseHeaders,
    },
    {
        label: '请求体',
        key: 'http.requestBody',
        type: 'json',
        extract: e => e.http?.requestBody,
    },
    {
        label: '响应体',
        key: 'http.responseBody',
        type: 'json',
        extract: e => e.http?.responseBody,
    },
]

export const resourceErrorFields: DetailField[] = [
    {
        label: '资源URL',
        key: 'resource.url',
        type: 'link',
        extract: e => e.resource?.url,
    },
    {
        label: '资源类型',
        key: 'resource.type',
        type: 'badge',
        extract: e => e.resource?.type,
    },
    {
        label: '标签名',
        key: 'resource.tagName',
        type: 'text',
        extract: e => e.resource?.tagName,
    },
    {
        label: 'HTML',
        key: 'resource.outerHTML',
        type: 'code',
        extract: e => e.resource?.outerHTML,
    },
]

export const performanceFields: DetailField[] = [
    { label: '分类', key: 'category', type: 'badge' },
    { label: 'URL', key: 'url', type: 'link' },
    { label: '请求方法', key: 'method', type: 'badge' },
    { label: '状态码', key: 'status', type: 'badge' },
    { label: '耗时', key: 'duration', type: 'duration' },
    { label: '是否慢请求', key: 'is_slow', type: 'badge' },
    { label: '是否成功', key: 'success', type: 'badge' },
    { label: '性能指标', key: 'metrics', type: 'json' },
]

export const webVitalFields: DetailField[] = [
    {
        label: '指标名称',
        key: 'name',
        type: 'text',
        extract: e => {
            // 优先使用 event_name,否则从 event_data 中提取
            if (e.event_name) return e.event_name
            const data = typeof e.event_data === 'string' ? JSON.parse(e.event_data) : e.event_data
            return data?.name || '-'
        },
    },
    {
        label: '指标值',
        key: 'value',
        type: 'text',
        extract: e => {
            // 优先使用 perf_value,否则从 event_data 中提取
            let name = e.event_name
            let value = e.perf_value

            const data = typeof e.event_data === 'string' ? JSON.parse(e.event_data) : e.event_data

            // 如果后端字段为空,从 event_data 提取
            if (!name && data?.name) {
                name = data.name as string
            }
            if ((value === undefined || value === 0) && data?.value !== undefined) {
                value = data.value as number
            }

            if (value === undefined || value === null) return '-'

            // 格式化数值显示
            if (name === 'CLS') {
                return value.toFixed(3)
            }
            return `${Math.round(value)}ms`
        },
    },
    {
        label: '评级',
        key: 'rating',
        type: 'badge',
        extract: e => {
            // 优先使用 perf_rating,否则从 event_data 中提取
            if (e.perf_rating) return e.perf_rating
            const data = typeof e.event_data === 'string' ? JSON.parse(e.event_data) : e.event_data
            return data?.rating || '-'
        },
    },
]

export const sessionFields: DetailField[] = [
    { label: '会话ID', key: 'session_id', type: 'text' },
    { label: '会话开始时间', key: 'session_start_time', type: 'timestamp' },
    { label: '会话时长', key: 'session_duration', type: 'duration' },
    { label: '事件数', key: 'session_event_count', type: 'number' },
    { label: '错误数', key: 'session_error_count', type: 'number' },
    { label: '页面浏览数', key: 'session_page_views', type: 'number' },
]

export const userFields: DetailField[] = [
    { label: '用户ID', key: 'user_id', type: 'text' },
    { label: '用户邮箱', key: 'user_email', type: 'text' },
    { label: '用户名', key: 'user_username', type: 'text' },
    { label: '用户IP', key: 'user_ip', type: 'text' },
]

export const deviceFields: DetailField[] = [
    { label: '浏览器', key: 'device.browser', type: 'text', extract: e => e.device?.browser },
    { label: '浏览器版本', key: 'device.browserVersion', type: 'text', extract: e => e.device?.browserVersion },
    { label: '操作系统', key: 'device.os', type: 'text', extract: e => e.device?.os },
    { label: '操作系统版本', key: 'device.osVersion', type: 'text', extract: e => e.device?.osVersion },
    { label: '设备类型', key: 'device.type', type: 'badge', extract: e => e.device?.type },
    { label: '屏幕分辨率', key: 'device.screen', type: 'text', extract: e => e.device?.screen },
]

export const networkFields: DetailField[] = [
    { label: '网络类型', key: 'network.type', type: 'badge', extract: e => e.network?.type },
    { label: '往返时间(RTT)', key: 'network.rtt', type: 'duration', extract: e => e.network?.rtt },
]

export const frameworkFields: DetailField[] = [
    { label: '框架', key: 'framework', type: 'badge' },
    { label: '组件名称', key: 'component_name', type: 'text' },
    { label: '组件堆栈', key: 'component_stack', type: 'code' },
]

export const metadataFields: DetailField[] = [
    {
        label: '去重计数',
        key: 'dedup_count',
        type: 'number',
        condition: e => !!e.dedup_count && e.dedup_count > 1,
    },
    {
        label: '采样率',
        key: 'sampling_rate',
        type: 'number',
        condition: e => !!e.sampling_rate,
    },
    {
        label: '是否被采样',
        key: 'sampling_sampled',
        type: 'badge',
        extract: e => (e.sampling_sampled ? '是' : '否'),
        condition: e => e.sampling_sampled !== undefined,
    },
]
