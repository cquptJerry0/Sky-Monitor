import type { CreateWidgetDto } from '../dashboard/dashboard.dto'

/**
 * 默认 Widget 配置
 * 为每个新创建的 Application 自动生成这些 Widget
 *
 * 设计原则:
 * - Widget 数量少 (4个),但每个信息密度高
 * - 覆盖核心监控维度: 性能 + 错误
 * - 避免依赖特定事件类型 (httpError、pageView)
 * - 布局紧凑,一屏展示完整
 */

/**
 * 生成默认 Widget 配置
 * @param _dashboardId Dashboard ID (保留参数以保持接口兼容)
 * @param appId Application ID
 * @returns 默认 Widget 配置数组
 */
export function generateDefaultWidgets(_dashboardId: string, appId: string): Omit<CreateWidgetDto, 'dashboardId'>[] {
    return [
        // 1. Web Vitals 性能趋势 (6个核心指标)
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
                {
                    id: 'cls',
                    fields: ['avg(perf_value)'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'webVital' },
                        { field: 'event_name', operator: '=', value: 'CLS' },
                    ],
                    groupBy: ['toStartOfHour(timestamp)'],
                    orderBy: [{ field: 'toStartOfHour(timestamp)', direction: 'ASC' }],
                    legend: 'CLS (累积布局偏移)',
                    color: '#8b5cf6',
                },
                {
                    id: 'ttfb',
                    fields: ['avg(perf_value)'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'webVital' },
                        { field: 'event_name', operator: '=', value: 'TTFB' },
                    ],
                    groupBy: ['toStartOfHour(timestamp)'],
                    orderBy: [{ field: 'toStartOfHour(timestamp)', direction: 'ASC' }],
                    legend: 'TTFB (首字节时间)',
                    color: '#ec4899',
                },
                {
                    id: 'inp',
                    fields: ['avg(perf_value)'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'webVital' },
                        { field: 'event_name', operator: '=', value: 'INP' },
                    ],
                    groupBy: ['toStartOfHour(timestamp)'],
                    orderBy: [{ field: 'toStartOfHour(timestamp)', direction: 'ASC' }],
                    legend: 'INP (交互延迟)',
                    color: '#f97316',
                },
            ],
            displayConfig: {
                yAxis: { unit: 'ms', min: 0 },
                showLegend: true,
                smooth: true,
            },
            layout: { x: 0, y: 0, w: 12, h: 6 },
        },

        // 2. 错误趋势分析 (3个错误类型)
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
            layout: { x: 0, y: 6, w: 6, h: 6 },
        },

        // 3. 错误类型分布 (Top 10)
        {
            title: '错误类型分布 (Top 10)',
            widgetType: 'bar',
            queries: [
                {
                    id: 'error-distribution',
                    fields: ['error_message', 'count() as count'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: 'IN', value: ['error', 'exception', 'unhandledrejection'] },
                        { field: 'error_message', operator: '!=', value: '' },
                    ],
                    groupBy: ['error_message'],
                    orderBy: [{ field: 'count()', direction: 'DESC' }],
                    limit: 10,
                },
            ],
            displayConfig: {
                horizontal: true,
                showLegend: false,
            },
            layout: { x: 6, y: 6, w: 6, h: 6 },
        },

        // 4. 错误详情分析表 (多维度)
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
            layout: { x: 0, y: 12, w: 12, h: 6 },
        },
    ]
}
