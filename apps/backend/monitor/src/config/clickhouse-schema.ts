/**
 * ClickHouse Schema 配置
 * 定义 monitor_events 表的完整字段结构
 * 用于:
 * 1. Widget 查询字段验证
 * 2. 前端字段选择器
 * 3. Schema 文档生成
 */

/**
 * 字段类型
 */
export type ClickHouseFieldType = 'UUID' | 'String' | 'UInt8' | 'UInt16' | 'UInt32' | 'UInt64' | 'Float32' | 'Float64' | 'DateTime'

/**
 * 字段配置
 */
export interface FieldConfig {
    type: ClickHouseFieldType
    comment: string
    groupable: boolean // 是否可用于 GROUP BY
    aggregatable: boolean // 是否可用于聚合函数 (count, sum, avg, etc.)
    category:
        | 'basic'
        | 'error'
        | 'device'
        | 'network'
        | 'framework'
        | 'http'
        | 'resource'
        | 'session'
        | 'user'
        | 'context'
        | 'performance'
        | 'metadata'
        | 'release'
}

/**
 * ClickHouse monitor_events 表完整字段定义
 * 总计: 59 个字段
 */
export const CLICKHOUSE_SCHEMA = {
    monitor_events: {
        // ========== 基础字段 (9个) ==========
        id: {
            type: 'UUID',
            comment: '事件唯一标识',
            groupable: false,
            aggregatable: false,
            category: 'basic',
        },
        app_id: {
            type: 'String',
            comment: '应用ID',
            groupable: true,
            aggregatable: false,
            category: 'basic',
        },
        event_type: {
            type: 'String',
            comment: '事件类型',
            groupable: true,
            aggregatable: false,
            category: 'basic',
        },
        event_name: {
            type: 'String',
            comment: '事件名称',
            groupable: true,
            aggregatable: false,
            category: 'basic',
        },
        event_data: {
            type: 'String',
            comment: '事件数据JSON',
            groupable: false,
            aggregatable: false,
            category: 'basic',
        },
        path: {
            type: 'String',
            comment: '页面路径',
            groupable: true,
            aggregatable: false,
            category: 'basic',
        },
        user_agent: {
            type: 'String',
            comment: '浏览器UA',
            groupable: false,
            aggregatable: false,
            category: 'basic',
        },
        timestamp: {
            type: 'DateTime',
            comment: '事件时间',
            groupable: true,
            aggregatable: false,
            category: 'basic',
        },
        created_at: {
            type: 'DateTime',
            comment: '创建时间',
            groupable: false,
            aggregatable: false,
            category: 'basic',
        },

        // ========== 错误相关 (5个) ==========
        error_message: {
            type: 'String',
            comment: '错误消息',
            groupable: true,
            aggregatable: false,
            category: 'error',
        },
        error_stack: {
            type: 'String',
            comment: '错误堆栈',
            groupable: false,
            aggregatable: false,
            category: 'error',
        },
        error_lineno: {
            type: 'UInt32',
            comment: '错误行号',
            groupable: true,
            aggregatable: true,
            category: 'error',
        },
        error_colno: {
            type: 'UInt32',
            comment: '错误列号',
            groupable: true,
            aggregatable: true,
            category: 'error',
        },
        error_fingerprint: {
            type: 'String',
            comment: '错误指纹',
            groupable: true,
            aggregatable: false,
            category: 'error',
        },

        // ========== 设备信息 (6个) ==========
        device_browser: {
            type: 'String',
            comment: '浏览器名称',
            groupable: true,
            aggregatable: false,
            category: 'device',
        },
        device_browser_version: {
            type: 'String',
            comment: '浏览器版本',
            groupable: true,
            aggregatable: false,
            category: 'device',
        },
        device_os: {
            type: 'String',
            comment: '操作系统',
            groupable: true,
            aggregatable: false,
            category: 'device',
        },
        device_os_version: {
            type: 'String',
            comment: '操作系统版本',
            groupable: true,
            aggregatable: false,
            category: 'device',
        },
        device_type: {
            type: 'String',
            comment: '设备类型',
            groupable: true,
            aggregatable: false,
            category: 'device',
        },
        device_screen: {
            type: 'String',
            comment: '屏幕分辨率',
            groupable: true,
            aggregatable: false,
            category: 'device',
        },

        // ========== 网络信息 (2个) ==========
        network_type: {
            type: 'String',
            comment: '网络类型',
            groupable: true,
            aggregatable: false,
            category: 'network',
        },
        network_rtt: {
            type: 'UInt32',
            comment: '往返时间',
            groupable: false,
            aggregatable: true,
            category: 'network',
        },

        // ========== 框架信息 (3个) ==========
        framework: {
            type: 'String',
            comment: '框架',
            groupable: true,
            aggregatable: false,
            category: 'framework',
        },
        component_name: {
            type: 'String',
            comment: '组件名称',
            groupable: true,
            aggregatable: false,
            category: 'framework',
        },
        component_stack: {
            type: 'String',
            comment: '组件堆栈',
            groupable: false,
            aggregatable: false,
            category: 'framework',
        },

        // ========== HTTP 错误 (9个) ==========
        http_url: {
            type: 'String',
            comment: '请求URL',
            groupable: true,
            aggregatable: false,
            category: 'http',
        },
        http_method: {
            type: 'String',
            comment: '请求方法',
            groupable: true,
            aggregatable: false,
            category: 'http',
        },
        http_status: {
            type: 'UInt16',
            comment: 'HTTP状态码',
            groupable: true,
            aggregatable: false,
            category: 'http',
        },
        http_duration: {
            type: 'UInt32',
            comment: '请求耗时',
            groupable: false,
            aggregatable: true,
            category: 'http',
        },
        http_status_text: {
            type: 'String',
            comment: 'HTTP状态文本',
            groupable: false,
            aggregatable: false,
            category: 'http',
        },
        http_request_headers: {
            type: 'String',
            comment: '请求头JSON',
            groupable: false,
            aggregatable: false,
            category: 'http',
        },
        http_response_headers: {
            type: 'String',
            comment: '响应头JSON',
            groupable: false,
            aggregatable: false,
            category: 'http',
        },
        http_request_body: {
            type: 'String',
            comment: '请求体',
            groupable: false,
            aggregatable: false,
            category: 'http',
        },
        http_response_body: {
            type: 'String',
            comment: '响应体',
            groupable: false,
            aggregatable: false,
            category: 'http',
        },

        // ========== 资源错误 (4个) ==========
        resource_url: {
            type: 'String',
            comment: '资源URL',
            groupable: true,
            aggregatable: false,
            category: 'resource',
        },
        resource_type: {
            type: 'String',
            comment: '资源类型',
            groupable: true,
            aggregatable: false,
            category: 'resource',
        },
        resource_tag_name: {
            type: 'String',
            comment: '资源标签名',
            groupable: false,
            aggregatable: false,
            category: 'resource',
        },
        resource_outer_html: {
            type: 'String',
            comment: '资源外部HTML',
            groupable: false,
            aggregatable: false,
            category: 'resource',
        },

        // ========== Session (6个) ==========
        session_id: {
            type: 'String',
            comment: '会话ID',
            groupable: true,
            aggregatable: false,
            category: 'session',
        },
        session_start_time: {
            type: 'UInt64',
            comment: '会话开始时间',
            groupable: false,
            aggregatable: false,
            category: 'session',
        },
        session_duration: {
            type: 'UInt32',
            comment: '会话持续时长',
            groupable: false,
            aggregatable: true,
            category: 'session',
        },
        session_event_count: {
            type: 'UInt16',
            comment: '会话事件数',
            groupable: false,
            aggregatable: true,
            category: 'session',
        },
        session_error_count: {
            type: 'UInt16',
            comment: '会话错误数',
            groupable: false,
            aggregatable: true,
            category: 'session',
        },
        session_page_views: {
            type: 'UInt16',
            comment: '会话页面浏览数',
            groupable: false,
            aggregatable: true,
            category: 'session',
        },

        // ========== User (4个) ==========
        user_id: {
            type: 'String',
            comment: '用户ID',
            groupable: true,
            aggregatable: false,
            category: 'user',
        },
        user_email: {
            type: 'String',
            comment: '用户邮箱',
            groupable: true,
            aggregatable: false,
            category: 'user',
        },
        user_username: {
            type: 'String',
            comment: '用户名',
            groupable: true,
            aggregatable: false,
            category: 'user',
        },
        user_ip: {
            type: 'String',
            comment: '用户IP',
            groupable: true,
            aggregatable: false,
            category: 'user',
        },

        // ========== Context (6个) ==========
        tags: {
            type: 'String',
            comment: '标签JSON',
            groupable: false,
            aggregatable: false,
            category: 'context',
        },
        extra: {
            type: 'String',
            comment: '额外信息JSON',
            groupable: false,
            aggregatable: false,
            category: 'context',
        },
        breadcrumbs: {
            type: 'String',
            comment: '面包屑JSON',
            groupable: false,
            aggregatable: false,
            category: 'context',
        },
        contexts: {
            type: 'String',
            comment: '上下文JSON',
            groupable: false,
            aggregatable: false,
            category: 'context',
        },
        event_level: {
            type: 'String',
            comment: '事件级别',
            groupable: true,
            aggregatable: false,
            category: 'context',
        },
        environment: {
            type: 'String',
            comment: '环境',
            groupable: true,
            aggregatable: false,
            category: 'context',
        },

        // ========== Performance (5个) ==========
        perf_category: {
            type: 'String',
            comment: '性能类别',
            groupable: true,
            aggregatable: false,
            category: 'performance',
        },
        perf_value: {
            type: 'Float64',
            comment: '性能值',
            groupable: false,
            aggregatable: true,
            category: 'performance',
        },
        perf_is_slow: {
            type: 'UInt8',
            comment: '是否慢请求',
            groupable: true,
            aggregatable: false,
            category: 'performance',
        },
        perf_success: {
            type: 'UInt8',
            comment: '是否成功',
            groupable: true,
            aggregatable: false,
            category: 'performance',
        },
        perf_metrics: {
            type: 'String',
            comment: '性能指标JSON',
            groupable: false,
            aggregatable: false,
            category: 'performance',
        },

        // ========== Metadata (3个) ==========
        dedup_count: {
            type: 'UInt32',
            comment: '去重计数',
            groupable: false,
            aggregatable: true,
            category: 'metadata',
        },
        sampling_rate: {
            type: 'Float32',
            comment: '采样率',
            groupable: false,
            aggregatable: false,
            category: 'metadata',
        },
        sampling_sampled: {
            type: 'UInt8',
            comment: '是否被采样',
            groupable: true,
            aggregatable: false,
            category: 'metadata',
        },

        // ========== Release (2个) ==========
        release: {
            type: 'String',
            comment: '版本号',
            groupable: true,
            aggregatable: false,
            category: 'release',
        },
        replay_id: {
            type: 'String',
            comment: 'Session Replay ID',
            groupable: true,
            aggregatable: false,
            category: 'release',
        },
    },
} as const

/**
 * 获取所有可分组字段
 */
export function getGroupableFields() {
    return Object.entries(CLICKHOUSE_SCHEMA.monitor_events)
        .filter(([_, config]) => config.groupable)
        .map(([field, config]) => ({ field, ...config }))
}

/**
 * 获取所有可聚合字段
 */
export function getAggregatableFields() {
    return Object.entries(CLICKHOUSE_SCHEMA.monitor_events)
        .filter(([_, config]) => config.aggregatable)
        .map(([field, config]) => ({ field, ...config }))
}

/**
 * 验证字段是否存在
 */
export function validateField(field: string): boolean {
    return field in CLICKHOUSE_SCHEMA.monitor_events
}

/**
 * 获取字段配置
 */
export function getFieldConfig(field: string): FieldConfig | undefined {
    return CLICKHOUSE_SCHEMA.monitor_events[field as keyof typeof CLICKHOUSE_SCHEMA.monitor_events]
}

/**
 * 按类别获取字段
 */
export function getFieldsByCategory(category: FieldConfig['category']) {
    return Object.entries(CLICKHOUSE_SCHEMA.monitor_events)
        .filter(([_, config]) => config.category === category)
        .map(([field, config]) => ({ field, ...config }))
}

/**
 * 获取所有字段名
 */
export function getAllFieldNames(): string[] {
    return Object.keys(CLICKHOUSE_SCHEMA.monitor_events)
}
