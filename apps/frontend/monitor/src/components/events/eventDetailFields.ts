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
    { label: '时间', key: 'timestamp', type: 'timestamp' },
    { label: '页面路径', key: 'path', type: 'text' },
    { label: 'User Agent', key: 'user_agent', type: 'text' },
]

export const errorFields: DetailField[] = [
    { label: '错误消息', key: 'error_message', type: 'text' },
    { label: '错误堆栈', key: 'error_stack', type: 'code' },
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
            const data = typeof e.event_data === 'string' ? JSON.parse(e.event_data) : e.event_data
            return data.name
        },
    },
    {
        label: '指标值',
        key: 'value',
        type: 'number',
        extract: e => {
            const data = typeof e.event_data === 'string' ? JSON.parse(e.event_data) : e.event_data
            return data.value
        },
    },
    {
        label: '评级',
        key: 'rating',
        type: 'badge',
        extract: e => {
            const data = typeof e.event_data === 'string' ? JSON.parse(e.event_data) : e.event_data
            return data.rating
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
