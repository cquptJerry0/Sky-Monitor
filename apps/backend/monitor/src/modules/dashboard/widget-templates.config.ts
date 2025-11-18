import type { QueryConfig } from '../../entities/dashboard-widget.entity'
import type { WidgetTemplate, TemplateParams } from './widget-template.types'

/**
 * 生成时间分组函数
 */
function getTimeGroupFunction(granularity: 'minute' | 'hour' | 'day' = 'hour'): string {
    switch (granularity) {
        case 'minute':
            return 'toStartOfMinute(timestamp)'
        case 'hour':
            return 'toStartOfHour(timestamp)'
        case 'day':
            return 'toStartOfDay(timestamp)'
        default:
            return 'toStartOfHour(timestamp)'
    }
}

/**
 * 生成 app_id 条件
 */
function getAppIdConditions(appId?: string | string[]) {
    if (!appId) {
        return []
    }

    if (Array.isArray(appId)) {
        const validIds = appId.filter(id => id && id.trim() !== '')
        if (validIds.length === 0) {
            return []
        }
        return validIds.map(id => ({ field: 'app_id', operator: '=' as const, value: id }))
    }

    if (appId.trim() === '') {
        return []
    }

    return [{ field: 'app_id', operator: '=' as const, value: appId }]
}

/**
 * Widget 模板配置
 */
export const WIDGET_TEMPLATES: Record<string, WidgetTemplate> = {
    // ==================== 性能监控类 ====================

    /**
     * 1. Web Vitals 性能趋势图
     */
    web_vitals_trend: {
        type: 'web_vitals_trend',
        name: 'Web Vitals 性能趋势',
        description: '监控 LCP, FCP, FID, CLS, TTFB, INP 六大核心性能指标的时间趋势',
        category: 'performance',
        widgetType: 'line',
        icon: 'TrendingUp',
        editableParams: {
            timeGranularity: {
                enabled: true,
                default: 'hour',
                options: ['minute', 'hour', 'day'],
            },
        },
        generateQuery: (params: TemplateParams): QueryConfig[] => {
            const timeGroup = getTimeGroupFunction(params.timeGranularity)
            const appConditions = getAppIdConditions(params.appId)

            const vitals = [
                { name: 'LCP', legend: 'LCP (最大内容绘制)', color: '#3b82f6' },
                { name: 'FCP', legend: 'FCP (首次内容绘制)', color: '#10b981' },
                { name: 'FID', legend: 'FID (首次输入延迟)', color: '#f59e0b' },
                { name: 'CLS', legend: 'CLS (累积布局偏移)', color: '#8b5cf6' },
                { name: 'TTFB', legend: 'TTFB (首字节时间)', color: '#ec4899' },
                { name: 'INP', legend: 'INP (交互延迟)', color: '#06b6d4' },
            ]

            return vitals.map(vital => ({
                id: vital.name.toLowerCase(),
                fields: ['avg(perf_value)'],
                conditions: [
                    ...appConditions,
                    { field: 'event_type', operator: '=', value: 'webVital' },
                    { field: 'event_name', operator: '=', value: vital.name },
                ],
                groupBy: [timeGroup],
                orderBy: [{ field: timeGroup, direction: 'ASC' }],
                legend: vital.legend,
                color: vital.color,
            }))
        },
    },

    /**
     * 2. 错误趋势图
     */
    error_trend: {
        type: 'error_trend',
        name: '错误趋势分析',
        description: '监控错误、异常、未处理拒绝等错误事件的时间趋势',
        category: 'error',
        widgetType: 'line',
        icon: 'AlertTriangle',
        editableParams: {
            timeGranularity: {
                enabled: true,
                default: 'hour',
                options: ['minute', 'hour', 'day'],
            },
        },
        generateQuery: (params: TemplateParams): QueryConfig[] => {
            const timeGroup = getTimeGroupFunction(params.timeGranularity)
            const appConditions = getAppIdConditions(params.appId)

            const errorTypes = [
                { type: 'error', legend: 'JS 错误', color: '#ef4444' },
                { type: 'unhandledrejection', legend: '未处理的 Promise 拒绝', color: '#f97316' },
                { type: 'httpError', legend: 'HTTP 错误', color: '#eab308' },
            ]

            return errorTypes.map(error => ({
                id: error.type,
                fields: ['count()'],
                conditions: [...appConditions, { field: 'event_type', operator: '=', value: error.type }],
                groupBy: [timeGroup],
                orderBy: [{ field: timeGroup, direction: 'ASC' }],
                legend: error.legend,
                color: error.color,
            }))
        },
    },

    /**
     * 3. 错误类型分布 (Top 10)
     */
    error_distribution: {
        type: 'error_distribution',
        name: '错误类型分布 Top 10',
        description: '展示发生次数最多的错误类型,帮助快速定位高频错误',
        category: 'error',
        widgetType: 'bar',
        icon: 'BarChart',
        editableParams: {
            limit: {
                enabled: true,
                default: 10,
                min: 5,
                max: 50,
            },
        },
        generateQuery: (params: TemplateParams): QueryConfig[] => {
            const appConditions = getAppIdConditions(params.appId)
            const limit = params.limit || 10

            return [
                {
                    id: 'error_distribution',
                    fields: ['error_message', 'count() as error_count'],
                    conditions: [
                        ...appConditions,
                        { field: 'event_type', operator: 'IN', value: ['error', 'unhandledrejection'] },
                        { field: 'error_message', operator: '!=', value: '' },
                    ],
                    groupBy: ['error_message'],
                    orderBy: [{ field: 'error_count', direction: 'DESC' }],
                    limit,
                },
            ]
        },
    },

    // ==================== 用户行为类 ====================

    /**
     * 4. 活跃用户数
     */
    active_users: {
        type: 'active_users',
        name: '活跃用户数',
        description: '展示当前时间范围内的去重用户数',
        category: 'user',
        widgetType: 'big_number',
        icon: 'Users',
        generateQuery: (params: TemplateParams): QueryConfig[] => {
            const appConditions = getAppIdConditions(params.appId)

            return [
                {
                    id: 'active_users',
                    fields: ['count(DISTINCT user_id) as user_count'],
                    conditions: [...appConditions, { field: 'user_id', operator: '!=', value: '' }],
                },
            ]
        },
    },

    /**
     * 5. Top 页面访问
     */
    top_pages: {
        type: 'top_pages',
        name: '页面访问 Top 10',
        description: '展示访问次数最多的页面路径',
        category: 'user',
        widgetType: 'bar',
        icon: 'FileText',
        editableParams: {
            limit: {
                enabled: true,
                default: 10,
                min: 5,
                max: 50,
            },
        },
        generateQuery: (params: TemplateParams): QueryConfig[] => {
            const appConditions = getAppIdConditions(params.appId)
            const limit = params.limit || 10

            return [
                {
                    id: 'top_pages',
                    fields: ['path', 'count() as visit_count'],
                    conditions: [...appConditions, { field: 'path', operator: '!=', value: '' }],
                    groupBy: ['path'],
                    orderBy: [{ field: 'visit_count', direction: 'DESC' }],
                    limit,
                },
            ]
        },
    },

    /**
     * 6. 页面性能分析表格
     */
    page_performance_table: {
        type: 'page_performance_table',
        name: '页面性能分析表格',
        description: '展示各页面的平均 LCP、FCP 和访问次数',
        category: 'performance',
        widgetType: 'table',
        icon: 'Table',
        editableParams: {
            limit: {
                enabled: true,
                default: 10,
                min: 5,
                max: 50,
            },
        },
        generateQuery: (params: TemplateParams): QueryConfig[] => {
            const appConditions = getAppIdConditions(params.appId)
            const limit = params.limit || 10

            return [
                {
                    id: 'page_performance',
                    fields: ['path', 'avg(perf_value) as avg_lcp', 'count() as visit_count'],
                    conditions: [
                        ...appConditions,
                        { field: 'event_type', operator: '=', value: 'webVital' },
                        { field: 'event_name', operator: '=', value: 'LCP' },
                        { field: 'path', operator: '!=', value: '' },
                    ],
                    groupBy: ['path'],
                    orderBy: [{ field: 'visit_count', direction: 'DESC' }],
                    limit,
                },
            ]
        },
    },

    /**
     * 7. 性能分布直方图
     */
    performance_distribution: {
        type: 'performance_distribution',
        name: '性能分布直方图',
        description: '展示 LCP 性能分级分布 (优秀/良好/需改进/差)',
        category: 'performance',
        widgetType: 'bar',
        icon: 'BarChart3',
        generateQuery: (params: TemplateParams): QueryConfig[] => {
            const appConditions = getAppIdConditions(params.appId)

            return [
                {
                    id: 'performance_distribution',
                    fields: [
                        `multiIf(
                            perf_value <= 2500, '优秀',
                            perf_value <= 4000, '良好',
                            perf_value <= 6000, '需改进',
                            '差'
                        ) as performance_level`,
                        'count() as count',
                    ],
                    conditions: [
                        ...appConditions,
                        { field: 'event_type', operator: '=', value: 'webVital' },
                        { field: 'event_name', operator: '=', value: 'LCP' },
                    ],
                    groupBy: ['performance_level'],
                    orderBy: [{ field: 'count', direction: 'DESC' }],
                },
            ]
        },
    },

    /**
     * 8. 网络性能分析
     */
    network_performance: {
        type: 'network_performance',
        name: '网络性能分析',
        description: '按网络类型分析平均 RTT 和性能表现',
        category: 'performance',
        widgetType: 'bar',
        icon: 'Wifi',
        generateQuery: (params: TemplateParams): QueryConfig[] => {
            const appConditions = getAppIdConditions(params.appId)

            return [
                {
                    id: 'network_performance',
                    fields: ['network_type', 'avg(network_rtt) as avg_rtt', 'count() as count'],
                    conditions: [...appConditions, { field: 'network_type', operator: '!=', value: '' }],
                    groupBy: ['network_type'],
                    orderBy: [{ field: 'count', direction: 'DESC' }],
                },
            ]
        },
    },

    /**
     * 9. HTTP 请求性能表格
     */
    http_performance_table: {
        type: 'http_performance_table',
        name: 'HTTP 请求性能表格',
        description: '展示 HTTP 请求的平均耗时和请求次数',
        category: 'performance',
        widgetType: 'table',
        icon: 'Globe',
        editableParams: {
            limit: {
                enabled: true,
                default: 10,
                min: 5,
                max: 50,
            },
        },
        generateQuery: (params: TemplateParams): QueryConfig[] => {
            const appConditions = getAppIdConditions(params.appId)
            const limit = params.limit || 10

            return [
                {
                    id: 'http_performance',
                    fields: ['http_url', 'http_method', 'avg(http_duration) as avg_duration', 'count() as request_count'],
                    conditions: [
                        ...appConditions,
                        { field: 'event_type', operator: '=', value: 'httpError' },
                        { field: 'http_url', operator: '!=', value: '' },
                    ],
                    groupBy: ['http_url', 'http_method'],
                    orderBy: [{ field: 'request_count', direction: 'DESC' }],
                    limit,
                },
            ]
        },
    },

    // ==================== 错误监控类 (补充) ====================

    /**
     * 10. 错误详情表格
     */
    error_details_table: {
        type: 'error_details_table',
        name: '错误详情表格',
        description: '展示错误消息、堆栈和发生次数的详细列表',
        category: 'error',
        widgetType: 'table',
        icon: 'AlertCircle',
        editableParams: {
            limit: {
                enabled: true,
                default: 10,
                min: 5,
                max: 50,
            },
        },
        generateQuery: (params: TemplateParams): QueryConfig[] => {
            const appConditions = getAppIdConditions(params.appId)
            const limit = params.limit || 10

            return [
                {
                    id: 'error_details',
                    fields: ['error_message', 'error_fingerprint', 'count() as error_count', 'max(timestamp) as last_seen'],
                    conditions: [
                        ...appConditions,
                        { field: 'event_type', operator: 'IN', value: ['error', 'unhandledrejection'] },
                        { field: 'error_message', operator: '!=', value: '' },
                    ],
                    groupBy: ['error_message', 'error_fingerprint'],
                    orderBy: [{ field: 'error_count', direction: 'DESC' }],
                    limit,
                },
            ]
        },
    },

    /**
     * 11. HTTP 错误分析
     */
    http_error_analysis: {
        type: 'http_error_analysis',
        name: 'HTTP 错误分析',
        description: '按 HTTP 状态码分析错误分布',
        category: 'error',
        widgetType: 'bar',
        icon: 'XCircle',
        generateQuery: (params: TemplateParams): QueryConfig[] => {
            const appConditions = getAppIdConditions(params.appId)

            return [
                {
                    id: 'http_error_analysis',
                    fields: ['http_status', 'count() as error_count'],
                    conditions: [
                        ...appConditions,
                        { field: 'event_type', operator: '=', value: 'httpError' },
                        { field: 'http_status', operator: '>=', value: 400 },
                    ],
                    groupBy: ['http_status'],
                    orderBy: [{ field: 'error_count', direction: 'DESC' }],
                },
            ]
        },
    },

    // ==================== 用户行为类 (补充) ====================

    /**
     * 12. 会话分析
     */
    session_analysis: {
        type: 'session_analysis',
        name: '会话分析',
        description: '展示会话时长、事件数和错误数的统计',
        category: 'user',
        widgetType: 'table',
        icon: 'Activity',
        editableParams: {
            limit: {
                enabled: true,
                default: 10,
                min: 5,
                max: 50,
            },
        },
        generateQuery: (params: TemplateParams): QueryConfig[] => {
            const appConditions = getAppIdConditions(params.appId)
            const limit = params.limit || 10

            return [
                {
                    id: 'session_analysis',
                    fields: [
                        'session_id',
                        'max(session_duration) as duration',
                        'max(session_event_count) as event_count',
                        'max(session_error_count) as error_count',
                    ],
                    conditions: [...appConditions, { field: 'session_id', operator: '!=', value: '' }],
                    groupBy: ['session_id'],
                    orderBy: [{ field: 'duration', direction: 'DESC' }],
                    limit,
                },
            ]
        },
    },

    // ==================== 设备环境类 ====================

    /**
     * 13. 浏览器分布
     */
    browser_distribution: {
        type: 'browser_distribution',
        name: '浏览器分布',
        description: '展示用户使用的浏览器类型和版本分布',
        category: 'device',
        widgetType: 'bar',
        icon: 'Chrome',
        generateQuery: (params: TemplateParams): QueryConfig[] => {
            const appConditions = getAppIdConditions(params.appId)

            return [
                {
                    id: 'browser_distribution',
                    fields: ['device_browser', 'count() as user_count'],
                    conditions: [...appConditions, { field: 'device_browser', operator: '!=', value: '' }],
                    groupBy: ['device_browser'],
                    orderBy: [{ field: 'user_count', direction: 'DESC' }],
                },
            ]
        },
    },

    /**
     * 14. 操作系统分布
     */
    os_distribution: {
        type: 'os_distribution',
        name: '操作系统分布',
        description: '展示用户使用的操作系统类型分布',
        category: 'device',
        widgetType: 'bar',
        icon: 'Monitor',
        generateQuery: (params: TemplateParams): QueryConfig[] => {
            const appConditions = getAppIdConditions(params.appId)

            return [
                {
                    id: 'os_distribution',
                    fields: ['device_os', 'count() as user_count'],
                    conditions: [...appConditions, { field: 'device_os', operator: '!=', value: '' }],
                    groupBy: ['device_os'],
                    orderBy: [{ field: 'user_count', direction: 'DESC' }],
                },
            ]
        },
    },

    /**
     * 15. 设备类型分布
     */
    device_type_distribution: {
        type: 'device_type_distribution',
        name: '设备类型分布',
        description: '展示用户使用的设备类型分布 (桌面/移动/平板)',
        category: 'device',
        widgetType: 'bar',
        icon: 'Smartphone',
        generateQuery: (params: TemplateParams): QueryConfig[] => {
            const appConditions = getAppIdConditions(params.appId)

            return [
                {
                    id: 'device_type_distribution',
                    fields: ['device_type', 'count() as user_count'],
                    conditions: [...appConditions, { field: 'device_type', operator: '!=', value: '' }],
                    groupBy: ['device_type'],
                    orderBy: [{ field: 'user_count', direction: 'DESC' }],
                },
            ]
        },
    },
}
