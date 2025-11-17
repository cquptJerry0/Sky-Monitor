/**
 * ClickHouse Schema 配置
 * 用于 SQL 编辑器的字段自动补全和验证
 */

export interface ClickHouseField {
    name: string
    type: string
    category: string
    description?: string
    groupable: boolean
    aggregatable: boolean
}

/**
 * ClickHouse monitor_events 表字段定义
 */
export const CLICKHOUSE_SCHEMA_FIELDS: ClickHouseField[] = [
    // 基础字段 (9个)
    { name: 'id', type: 'String', category: '基础', description: '事件唯一标识', groupable: false, aggregatable: false },
    { name: 'app_id', type: 'String', category: '基础', description: '应用 ID', groupable: true, aggregatable: false },
    { name: 'event_type', type: 'String', category: '基础', description: '事件类型', groupable: true, aggregatable: false },
    { name: 'event_name', type: 'String', category: '基础', description: '事件名称', groupable: true, aggregatable: false },
    { name: 'event_data', type: 'String', category: '基础', description: '事件数据 JSON', groupable: false, aggregatable: false },
    { name: 'path', type: 'String', category: '基础', description: '页面路径', groupable: true, aggregatable: false },
    { name: 'user_agent', type: 'String', category: '基础', description: '用户代理', groupable: false, aggregatable: false },
    { name: 'timestamp', type: 'DateTime64', category: '基础', description: '事件时间戳', groupable: true, aggregatable: false },
    { name: 'created_at', type: 'DateTime', category: '基础', description: '创建时间', groupable: true, aggregatable: false },

    // 错误字段 (5个)
    { name: 'error_message', type: 'String', category: '错误', description: '错误消息', groupable: true, aggregatable: false },
    { name: 'error_stack', type: 'String', category: '错误', description: '错误堆栈', groupable: false, aggregatable: false },
    { name: 'error_lineno', type: 'UInt32', category: '错误', description: '错误行号', groupable: false, aggregatable: true },
    { name: 'error_colno', type: 'UInt32', category: '错误', description: '错误列号', groupable: false, aggregatable: true },
    { name: 'error_fingerprint', type: 'String', category: '错误', description: '错误指纹', groupable: true, aggregatable: false },

    // 设备字段 (6个)
    { name: 'device_browser', type: 'String', category: '设备', description: '浏览器', groupable: true, aggregatable: false },
    {
        name: 'device_browser_version',
        type: 'String',
        category: '设备',
        description: '浏览器版本',
        groupable: true,
        aggregatable: false,
    },
    { name: 'device_os', type: 'String', category: '设备', description: '操作系统', groupable: true, aggregatable: false },
    { name: 'device_os_version', type: 'String', category: '设备', description: '操作系统版本', groupable: true, aggregatable: false },
    { name: 'device_type', type: 'String', category: '设备', description: '设备类型', groupable: true, aggregatable: false },
    { name: 'device_screen', type: 'String', category: '设备', description: '屏幕分辨率', groupable: true, aggregatable: false },

    // 网络字段 (2个)
    { name: 'network_type', type: 'String', category: '网络', description: '网络类型', groupable: true, aggregatable: false },
    { name: 'network_rtt', type: 'UInt32', category: '网络', description: '网络延迟 RTT', groupable: false, aggregatable: true },

    // 框架字段 (3个)
    { name: 'framework', type: 'String', category: '框架', description: '前端框架', groupable: true, aggregatable: false },
    { name: 'component_name', type: 'String', category: '框架', description: '组件名称', groupable: true, aggregatable: false },
    { name: 'component_stack', type: 'String', category: '框架', description: '组件堆栈', groupable: false, aggregatable: false },

    // HTTP 字段 (9个)
    { name: 'http_url', type: 'String', category: 'HTTP', description: 'HTTP 请求 URL', groupable: true, aggregatable: false },
    { name: 'http_method', type: 'String', category: 'HTTP', description: 'HTTP 请求方法', groupable: true, aggregatable: false },
    { name: 'http_status', type: 'UInt16', category: 'HTTP', description: 'HTTP 状态码', groupable: true, aggregatable: false },
    { name: 'http_duration', type: 'UInt32', category: 'HTTP', description: 'HTTP 请求耗时', groupable: false, aggregatable: true },
    { name: 'http_status_text', type: 'String', category: 'HTTP', description: 'HTTP 状态文本', groupable: false, aggregatable: false },
    {
        name: 'http_request_headers',
        type: 'String',
        category: 'HTTP',
        description: 'HTTP 请求头 JSON',
        groupable: false,
        aggregatable: false,
    },
    {
        name: 'http_response_headers',
        type: 'String',
        category: 'HTTP',
        description: 'HTTP 响应头 JSON',
        groupable: false,
        aggregatable: false,
    },
    {
        name: 'http_request_body',
        type: 'String',
        category: 'HTTP',
        description: 'HTTP 请求体',
        groupable: false,
        aggregatable: false,
    },
    {
        name: 'http_response_body',
        type: 'String',
        category: 'HTTP',
        description: 'HTTP 响应体',
        groupable: false,
        aggregatable: false,
    },

    // 资源字段 (4个)
    { name: 'resource_url', type: 'String', category: '资源', description: '资源 URL', groupable: true, aggregatable: false },
    { name: 'resource_type', type: 'String', category: '资源', description: '资源类型', groupable: true, aggregatable: false },
    { name: 'resource_tag_name', type: 'String', category: '资源', description: '资源标签名', groupable: true, aggregatable: false },
    { name: 'resource_outer_html', type: 'String', category: '资源', description: '资源 HTML', groupable: false, aggregatable: false },

    // 会话字段 (6个)
    { name: 'session_id', type: 'String', category: '会话', description: '会话 ID', groupable: true, aggregatable: false },
    {
        name: 'session_start_time',
        type: 'DateTime64',
        category: '会话',
        description: '会话开始时间',
        groupable: false,
        aggregatable: false,
    },
    { name: 'session_duration', type: 'UInt32', category: '会话', description: '会话时长', groupable: false, aggregatable: true },
    {
        name: 'session_event_count',
        type: 'UInt32',
        category: '会话',
        description: '会话事件数',
        groupable: false,
        aggregatable: true,
    },
    {
        name: 'session_error_count',
        type: 'UInt32',
        category: '会话',
        description: '会话错误数',
        groupable: false,
        aggregatable: true,
    },
    { name: 'session_page_views', type: 'UInt32', category: '会话', description: '会话页面浏览数', groupable: false, aggregatable: true },

    // 用户字段 (4个)
    { name: 'user_id', type: 'String', category: '用户', description: '用户 ID', groupable: true, aggregatable: false },
    { name: 'user_email', type: 'String', category: '用户', description: '用户邮箱', groupable: true, aggregatable: false },
    { name: 'user_username', type: 'String', category: '用户', description: '用户名', groupable: true, aggregatable: false },
    { name: 'user_ip', type: 'String', category: '用户', description: '用户 IP', groupable: true, aggregatable: false },

    // 上下文字段 (6个)
    { name: 'tags', type: 'String', category: '上下文', description: '标签 JSON', groupable: false, aggregatable: false },
    { name: 'extra', type: 'String', category: '上下文', description: '额外数据 JSON', groupable: false, aggregatable: false },
    { name: 'breadcrumbs', type: 'String', category: '上下文', description: '面包屑 JSON', groupable: false, aggregatable: false },
    { name: 'contexts', type: 'String', category: '上下文', description: '上下文 JSON', groupable: false, aggregatable: false },
    { name: 'event_level', type: 'String', category: '上下文', description: '事件级别', groupable: true, aggregatable: false },
    { name: 'environment', type: 'String', category: '上下文', description: '环境', groupable: true, aggregatable: false },

    // 性能字段 (5个)
    { name: 'perf_category', type: 'String', category: '性能', description: '性能类别', groupable: true, aggregatable: false },
    { name: 'perf_value', type: 'Float64', category: '性能', description: '性能值', groupable: false, aggregatable: true },
    { name: 'perf_is_slow', type: 'UInt8', category: '性能', description: '是否慢请求', groupable: true, aggregatable: false },
    { name: 'perf_success', type: 'UInt8', category: '性能', description: '是否成功', groupable: true, aggregatable: false },
    { name: 'perf_metrics', type: 'String', category: '性能', description: '性能指标 JSON', groupable: false, aggregatable: false },
]
