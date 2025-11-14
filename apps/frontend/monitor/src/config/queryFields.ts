/**
 * ClickHouse 查询字段配置
 */

export interface FieldConfig {
    value: string
    label: string
    category: string
    type: 'string' | 'number' | 'datetime'
    aggregatable: boolean
    groupable: boolean
}

/**
 * 聚合函数配置
 */
export const AGGREGATION_FUNCTIONS = [
    { value: 'count()', label: '计数 (count)' },
    { value: 'count(DISTINCT {field})', label: '去重计数 (count distinct)' },
    { value: 'sum({field})', label: '求和 (sum)' },
    { value: 'avg({field})', label: '平均值 (avg)' },
    { value: 'min({field})', label: '最小值 (min)' },
    { value: 'max({field})', label: '最大值 (max)' },
] as const

/**
 * 操作符配置
 */
export const OPERATORS = [
    { value: '=', label: '等于 (=)' },
    { value: '!=', label: '不等于 (!=)' },
    { value: '>', label: '大于 (>)' },
    { value: '<', label: '小于 (<)' },
    { value: '>=', label: '大于等于 (>=)' },
    { value: '<=', label: '小于等于 (<=)' },
    { value: 'IN', label: '包含于 (IN)' },
    { value: 'LIKE', label: '模糊匹配 (LIKE)' },
] as const

/**
 * 时间分组函数
 */
export const TIME_GROUP_FUNCTIONS = [
    { value: 'toStartOfMinute(timestamp)', label: '按分钟' },
    { value: 'toStartOfFiveMinutes(timestamp)', label: '按 5 分钟' },
    { value: 'toStartOfTenMinutes(timestamp)', label: '按 10 分钟' },
    { value: 'toStartOfFifteenMinutes(timestamp)', label: '按 15 分钟' },
    { value: 'toStartOfHour(timestamp)', label: '按小时' },
    { value: 'toStartOfDay(timestamp)', label: '按天' },
    { value: 'toStartOfWeek(timestamp)', label: '按周' },
    { value: 'toStartOfMonth(timestamp)', label: '按月' },
] as const

/**
 * 可查询字段列表
 */
export const QUERY_FIELDS: FieldConfig[] = [
    // 基础字段
    { value: 'app_id', label: '应用 ID', category: '基础', type: 'string', aggregatable: false, groupable: true },
    { value: 'event_type', label: '事件类型', category: '基础', type: 'string', aggregatable: false, groupable: true },
    { value: 'event_name', label: '事件名称', category: '基础', type: 'string', aggregatable: false, groupable: true },
    { value: 'path', label: '页面路径', category: '基础', type: 'string', aggregatable: false, groupable: true },
    { value: 'timestamp', label: '时间戳', category: '基础', type: 'datetime', aggregatable: false, groupable: true },

    // 错误相关
    { value: 'error_message', label: '错误消息', category: '错误', type: 'string', aggregatable: false, groupable: true },
    { value: 'error_fingerprint', label: '错误指纹', category: '错误', type: 'string', aggregatable: false, groupable: true },
    { value: 'error_lineno', label: '错误行号', category: '错误', type: 'number', aggregatable: true, groupable: true },
    { value: 'error_colno', label: '错误列号', category: '错误', type: 'number', aggregatable: true, groupable: true },

    // 设备信息
    { value: 'device_browser', label: '浏览器', category: '设备', type: 'string', aggregatable: false, groupable: true },
    { value: 'device_browser_version', label: '浏览器版本', category: '设备', type: 'string', aggregatable: false, groupable: true },
    { value: 'device_os', label: '操作系统', category: '设备', type: 'string', aggregatable: false, groupable: true },
    { value: 'device_os_version', label: '操作系统版本', category: '设备', type: 'string', aggregatable: false, groupable: true },
    { value: 'device_type', label: '设备类型', category: '设备', type: 'string', aggregatable: false, groupable: true },

    // 网络信息
    { value: 'network_type', label: '网络类型', category: '网络', type: 'string', aggregatable: false, groupable: true },
    { value: 'network_rtt', label: '网络延迟', category: '网络', type: 'number', aggregatable: true, groupable: false },

    // 框架信息
    { value: 'framework', label: '框架', category: '框架', type: 'string', aggregatable: false, groupable: true },
    { value: 'component_name', label: '组件名称', category: '框架', type: 'string', aggregatable: false, groupable: true },

    // HTTP 错误
    { value: 'http_url', label: 'HTTP URL', category: 'HTTP', type: 'string', aggregatable: false, groupable: true },
    { value: 'http_method', label: 'HTTP 方法', category: 'HTTP', type: 'string', aggregatable: false, groupable: true },
    { value: 'http_status', label: 'HTTP 状态码', category: 'HTTP', type: 'number', aggregatable: false, groupable: true },
    { value: 'http_duration', label: 'HTTP 耗时', category: 'HTTP', type: 'number', aggregatable: true, groupable: false },

    // 资源错误
    { value: 'resource_url', label: '资源 URL', category: '资源', type: 'string', aggregatable: false, groupable: true },
    { value: 'resource_type', label: '资源类型', category: '资源', type: 'string', aggregatable: false, groupable: true },

    // Session
    { value: 'session_id', label: '会话 ID', category: '会话', type: 'string', aggregatable: false, groupable: true },
    { value: 'session_duration', label: '会话时长', category: '会话', type: 'number', aggregatable: true, groupable: false },
    { value: 'session_event_count', label: '会话事件数', category: '会话', type: 'number', aggregatable: true, groupable: false },
    { value: 'session_error_count', label: '会话错误数', category: '会话', type: 'number', aggregatable: true, groupable: false },

    // User
    { value: 'user_id', label: '用户 ID', category: '用户', type: 'string', aggregatable: false, groupable: true },
    { value: 'user_email', label: '用户邮箱', category: '用户', type: 'string', aggregatable: false, groupable: true },
    { value: 'user_username', label: '用户名', category: '用户', type: 'string', aggregatable: false, groupable: true },

    // Performance
    { value: 'perf_category', label: '性能类别', category: '性能', type: 'string', aggregatable: false, groupable: true },
    { value: 'perf_value', label: '性能值', category: '性能', type: 'number', aggregatable: true, groupable: false },
    { value: 'perf_is_slow', label: '是否慢请求', category: '性能', type: 'number', aggregatable: false, groupable: true },

    // Metadata
    { value: 'environment', label: '环境', category: '元数据', type: 'string', aggregatable: false, groupable: true },
    { value: 'event_level', label: '事件级别', category: '元数据', type: 'string', aggregatable: false, groupable: true },
    { value: 'release', label: '版本号', category: '元数据', type: 'string', aggregatable: false, groupable: true },
    { value: 'dedup_count', label: '去重计数', category: '元数据', type: 'number', aggregatable: true, groupable: false },
]

/**
 * 按类别分组字段
 */
export const FIELDS_BY_CATEGORY = QUERY_FIELDS.reduce(
    (acc, field) => {
        if (!acc[field.category]) {
            acc[field.category] = []
        }
        acc[field.category].push(field)
        return acc
    },
    {} as Record<string, FieldConfig[]>
)
