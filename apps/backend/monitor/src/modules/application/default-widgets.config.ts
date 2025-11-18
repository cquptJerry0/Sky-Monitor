import type { CreateWidgetDto } from '../dashboard/dashboard.dto'

/**
 * 默认 Widget 配置
 * 为每个新创建的 Application 自动生成这些 Widget
 *
 * 新设计原则:
 * - 顶部: 4个关键指标卡片 (BigNumber)
 * - 中部: Web Vitals 性能趋势图 (优化版)
 * - 底部: 错误趋势 + 浏览器分布
 * - 布局: 12列网格,响应式设计
 */

/**
 * 生成默认 Widget 配置
 * @param _dashboardId Dashboard ID (保留参数以保持接口兼容)
 * @param appId Application ID
 * @returns 默认 Widget 配置数组
 */
export function generateDefaultWidgets(_dashboardId: string, appId: string): Omit<CreateWidgetDto, 'dashboardId'>[] {
    return [
        // 第一行: 4个关键指标卡片 (每个3列宽)
        {
            title: '总事件数',
            widgetType: 'big_number',
            queries: [
                {
                    id: 'total-events',
                    fields: ['count() as value'],
                    conditions: [{ field: 'app_id', operator: '=', value: appId }],
                },
            ],
            layout: { x: 0, y: 0, w: 3, h: 3 },
        },
        {
            title: '错误总数',
            widgetType: 'big_number',
            queries: [
                {
                    id: 'total-errors',
                    fields: ['count() as value'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: 'IN', value: ['error', 'exception', 'unhandledrejection'] },
                    ],
                },
            ],
            layout: { x: 3, y: 0, w: 3, h: 3 },
        },
        {
            title: '活跃用户',
            widgetType: 'big_number',
            queries: [
                {
                    id: 'active-users',
                    fields: ['uniq(user_id) as value'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'user_id', operator: '!=', value: '' },
                    ],
                },
            ],
            layout: { x: 6, y: 0, w: 3, h: 3 },
        },
        {
            title: '平均 LCP',
            widgetType: 'big_number',
            queries: [
                {
                    id: 'avg-lcp',
                    fields: ['round(avg(perf_value)) as value'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'webVital' },
                        { field: 'event_name', operator: '=', value: 'LCP' },
                    ],
                },
            ],
            displayConfig: {
                unit: 'ms',
            },
            layout: { x: 9, y: 0, w: 3, h: 3 },
        },

        // 第二行: Web Vitals 性能趋势 (全宽)
        {
            title: 'Web Vitals 性能趋势',
            widgetType: 'line',
            queries: [
                {
                    id: 'ttfb',
                    fields: ['toStartOfHour(timestamp) as time', 'avg(perf_value)'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'webVital' },
                        { field: 'event_name', operator: '=', value: 'TTFB' },
                    ],
                    groupBy: ['toStartOfHour(timestamp)'],
                    orderBy: [{ field: 'toStartOfHour(timestamp)', direction: 'ASC' }],
                    legend: 'TTFB (首字节时间)',
                    color: '#60a5fa',
                },
                {
                    id: 'inp',
                    fields: ['toStartOfHour(timestamp) as time', 'avg(perf_value)'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'webVital' },
                        { field: 'event_name', operator: '=', value: 'INP' },
                    ],
                    groupBy: ['toStartOfHour(timestamp)'],
                    orderBy: [{ field: 'toStartOfHour(timestamp)', direction: 'ASC' }],
                    legend: 'INP (交互延迟)',
                    color: '#3b82f6',
                },
                {
                    id: 'fcp',
                    fields: ['toStartOfHour(timestamp) as time', 'avg(perf_value)'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'webVital' },
                        { field: 'event_name', operator: '=', value: 'FCP' },
                    ],
                    groupBy: ['toStartOfHour(timestamp)'],
                    orderBy: [{ field: 'toStartOfHour(timestamp)', direction: 'ASC' }],
                    legend: 'FCP (首次内容绘制)',
                    color: '#2563eb',
                },
                {
                    id: 'lcp',
                    fields: ['toStartOfHour(timestamp) as time', 'avg(perf_value)'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'webVital' },
                        { field: 'event_name', operator: '=', value: 'LCP' },
                    ],
                    groupBy: ['toStartOfHour(timestamp)'],
                    orderBy: [{ field: 'toStartOfHour(timestamp)', direction: 'ASC' }],
                    legend: 'LCP (最大内容绘制)',
                    color: '#1d4ed8',
                },
            ],
            displayConfig: {
                yAxis: { unit: 'ms', min: 0 },
                showLegend: true,
            },
            layout: { x: 0, y: 3, w: 12, h: 6 },
        },

        // 第三行: 事件类型分布饼图 + 错误类型雷达图
        {
            title: '事件类型分布',
            widgetType: 'pie',
            queries: [
                {
                    id: 'event-type-distribution',
                    fields: ['event_type', 'count() as count'],
                    conditions: [{ field: 'app_id', operator: '=', value: appId }],
                    groupBy: ['event_type'],
                    orderBy: [{ field: 'count()', direction: 'DESC' }],
                    limit: 10,
                },
            ],
            displayConfig: {
                showLegend: true,
            },
            layout: { x: 0, y: 9, w: 6, h: 5 },
        },
        {
            title: '错误类型分布',
            widgetType: 'radar',
            queries: [
                {
                    id: 'error-type-distribution',
                    fields: ['event_type', 'count() as count'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: 'IN', value: ['error', 'exception', 'unhandledrejection'] },
                    ],
                    groupBy: ['event_type'],
                    orderBy: [{ field: 'count()', direction: 'DESC' }],
                    limit: 5,
                },
            ],
            displayConfig: {
                showLegend: false,
            },
            layout: { x: 6, y: 9, w: 6, h: 5 },
        },
    ]
}
