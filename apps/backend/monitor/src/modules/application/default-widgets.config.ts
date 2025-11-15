import type { CreateWidgetDto } from '../dashboard/dashboard.dto'

/**
 * 默认 Widget 配置
 * 为每个新创建的 Application 自动生成这些 Widget
 */

/**
 * 生成默认 Widget 配置
 * @param dashboardId Dashboard ID
 * @param appId Application ID
 * @returns 默认 Widget 配置数组
 */
export function generateDefaultWidgets(dashboardId: string, appId: string): Omit<CreateWidgetDto, 'dashboardId'>[] {
    return [
        // 1. 核心指标概览 (4个大数字)
        {
            title: '总错误数',
            widgetType: 'big_number',
            queries: [
                {
                    id: 'total-errors',
                    fields: ['count()'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: 'IN', value: ['error', 'exception', 'unhandledrejection'] },
                    ],
                    legend: '错误',
                },
            ],
            displayConfig: {
                trend: true,
                trendField: 'count()',
                icon: 'AlertCircle',
                color: '#ef4444',
            },
            layout: { x: 0, y: 0, w: 3, h: 2 },
        },
        {
            title: '活跃用户',
            widgetType: 'big_number',
            queries: [
                {
                    id: 'active-users',
                    fields: ['count(DISTINCT user_id)'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'user_id', operator: '!=', value: '' },
                    ],
                    legend: '用户',
                },
            ],
            displayConfig: {
                icon: 'Users',
                color: '#3b82f6',
            },
            layout: { x: 3, y: 0, w: 3, h: 2 },
        },
        {
            title: '页面浏览量',
            widgetType: 'big_number',
            queries: [
                {
                    id: 'page-views',
                    fields: ['count()'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'pageView' },
                    ],
                    legend: 'PV',
                },
            ],
            displayConfig: {
                icon: 'Eye',
                color: '#10b981',
            },
            layout: { x: 6, y: 0, w: 3, h: 2 },
        },
        {
            title: '平均响应时间',
            widgetType: 'big_number',
            queries: [
                {
                    id: 'avg-response-time',
                    fields: ['avg(http_duration)'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'httpError' },
                        { field: 'http_duration', operator: '>', value: 0 },
                    ],
                    legend: 'ms',
                },
            ],
            displayConfig: {
                icon: 'Clock',
                color: '#f59e0b',
                unit: 'ms',
            },
            layout: { x: 9, y: 0, w: 3, h: 2 },
        },

        // 2. 错误趋势 (多维度)
        {
            title: '错误趋势分析',
            widgetType: 'line',
            queries: [
                {
                    id: 'error-trend',
                    fields: ['count()'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'error' },
                    ],
                    groupBy: ['toStartOfHour(timestamp)'],
                    orderBy: [{ field: 'toStartOfHour(timestamp)', direction: 'ASC' }],
                    legend: 'JavaScript 错误',
                    color: '#ef4444',
                },
                {
                    id: 'exception-trend',
                    fields: ['count()'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'exception' },
                    ],
                    groupBy: ['toStartOfHour(timestamp)'],
                    orderBy: [{ field: 'toStartOfHour(timestamp)', direction: 'ASC' }],
                    legend: '异常',
                    color: '#f97316',
                },
                {
                    id: 'unhandled-trend',
                    fields: ['count()'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'unhandledrejection' },
                    ],
                    groupBy: ['toStartOfHour(timestamp)'],
                    orderBy: [{ field: 'toStartOfHour(timestamp)', direction: 'ASC' }],
                    legend: '未处理的 Promise',
                    color: '#dc2626',
                },
            ],
            displayConfig: {
                showLegend: true,
                smooth: true,
            },
            layout: { x: 0, y: 2, w: 8, h: 4 },
        },

        // 3. Web Vitals 性能指标
        {
            title: 'Web Vitals 性能趋势',
            widgetType: 'line',
            queries: [
                {
                    id: 'lcp',
                    fields: ['avg(perf_value)'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'webVital' },
                        { field: 'event_name', operator: '=', value: 'LCP' },
                    ],
                    groupBy: ['toStartOfHour(timestamp)'],
                    orderBy: [{ field: 'toStartOfHour(timestamp)', direction: 'ASC' }],
                    legend: 'LCP (最大内容绘制)',
                    color: '#3b82f6',
                },
                {
                    id: 'fcp',
                    fields: ['avg(perf_value)'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'webVital' },
                        { field: 'event_name', operator: '=', value: 'FCP' },
                    ],
                    groupBy: ['toStartOfHour(timestamp)'],
                    orderBy: [{ field: 'toStartOfHour(timestamp)', direction: 'ASC' }],
                    legend: 'FCP (首次内容绘制)',
                    color: '#10b981',
                },
                {
                    id: 'fid',
                    fields: ['avg(perf_value)'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'webVital' },
                        { field: 'event_name', operator: '=', value: 'FID' },
                    ],
                    groupBy: ['toStartOfHour(timestamp)'],
                    orderBy: [{ field: 'toStartOfHour(timestamp)', direction: 'ASC' }],
                    legend: 'FID (首次输入延迟)',
                    color: '#f59e0b',
                },
            ],
            displayConfig: {
                yAxis: { unit: 'ms', min: 0 },
                showLegend: true,
                smooth: true,
            },
            layout: { x: 8, y: 2, w: 4, h: 4 },
        },

        // 4. 错误详情表 (联合多个维度)
        {
            title: '错误详情分析',
            widgetType: 'table',
            queries: [
                {
                    id: 'error-details',
                    fields: [
                        'error_message',
                        'event_type',
                        'count() as error_count',
                        'count(DISTINCT user_id) as affected_users',
                        'count(DISTINCT session_id) as affected_sessions',
                        'max(timestamp) as last_seen',
                    ],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: 'IN', value: ['error', 'exception', 'unhandledrejection'] },
                        { field: 'error_message', operator: '!=', value: '' },
                    ],
                    groupBy: ['error_message', 'event_type'],
                    orderBy: [{ field: 'count()', direction: 'DESC' }],
                    limit: 20,
                },
            ],
            layout: { x: 0, y: 6, w: 12, h: 5 },
        },

        // 5. 浏览器和设备分布
        {
            title: '浏览器分布',
            widgetType: 'bar',
            queries: [
                {
                    id: 'browser-dist',
                    fields: ['device_browser', 'count() as count'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'device_browser', operator: '!=', value: '' },
                    ],
                    groupBy: ['device_browser'],
                    orderBy: [{ field: 'count()', direction: 'DESC' }],
                    limit: 8,
                },
            ],
            displayConfig: {
                horizontal: true,
            },
            layout: { x: 0, y: 11, w: 4, h: 4 },
        },

        // 6. 操作系统分布
        {
            title: '操作系统分布',
            widgetType: 'bar',
            queries: [
                {
                    id: 'os-dist',
                    fields: ['device_os', 'count() as count'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'device_os', operator: '!=', value: '' },
                    ],
                    groupBy: ['device_os'],
                    orderBy: [{ field: 'count()', direction: 'DESC' }],
                    limit: 8,
                },
            ],
            displayConfig: {
                horizontal: true,
            },
            layout: { x: 4, y: 11, w: 4, h: 4 },
        },

        // 7. 页面访问 Top 10
        {
            title: 'Top 10 访问页面',
            widgetType: 'table',
            queries: [
                {
                    id: 'top-pages',
                    fields: [
                        'page_url',
                        'count() as views',
                        'count(DISTINCT user_id) as unique_users',
                        'avg(perf_page_load_time) as avg_load_time',
                    ],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'pageView' },
                        { field: 'page_url', operator: '!=', value: '' },
                    ],
                    groupBy: ['page_url'],
                    orderBy: [{ field: 'count()', direction: 'DESC' }],
                    limit: 10,
                },
            ],
            layout: { x: 8, y: 11, w: 4, h: 4 },
        },

        // 8. HTTP 错误分析
        {
            title: 'HTTP 错误状态码分布',
            widgetType: 'bar',
            queries: [
                {
                    id: 'http-4xx',
                    fields: ['count()'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'httpError' },
                        { field: 'http_status', operator: '>=', value: 400 },
                        { field: 'http_status', operator: '<', value: 500 },
                    ],
                    groupBy: ['http_status'],
                    orderBy: [{ field: 'count()', direction: 'DESC' }],
                    legend: '4xx 客户端错误',
                    color: '#f59e0b',
                },
                {
                    id: 'http-5xx',
                    fields: ['count()'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'httpError' },
                        { field: 'http_status', operator: '>=', value: 500 },
                    ],
                    groupBy: ['http_status'],
                    orderBy: [{ field: 'count()', direction: 'DESC' }],
                    legend: '5xx 服务器错误',
                    color: '#ef4444',
                },
            ],
            displayConfig: {
                stacked: true,
                showLegend: true,
            },
            layout: { x: 0, y: 15, w: 6, h: 4 },
        },

        // 9. 慢请求分析
        {
            title: 'Top 10 慢请求',
            widgetType: 'table',
            queries: [
                {
                    id: 'slow-requests',
                    fields: [
                        'http_url',
                        'http_method',
                        'avg(http_duration) as avg_duration',
                        'max(http_duration) as max_duration',
                        'count() as request_count',
                    ],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'httpError' },
                        { field: 'perf_is_slow', operator: '=', value: 1 },
                        { field: 'http_url', operator: '!=', value: '' },
                    ],
                    groupBy: ['http_url', 'http_method'],
                    orderBy: [{ field: 'avg(http_duration)', direction: 'DESC' }],
                    limit: 10,
                },
            ],
            layout: { x: 6, y: 15, w: 6, h: 4 },
        },
    ]
}
