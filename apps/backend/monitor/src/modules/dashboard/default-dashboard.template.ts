import type { QueryConfig } from '../../entities/dashboard-widget.entity'

/**
 * 默认Dashboard模板
 * 这是唯一的模板配置,用于创建应用时自动生成默认监控面板
 */
export function generateDefaultDashboardWidgets(appId: string): Array<{
    title: string
    widgetType: 'line' | 'bar' | 'area' | 'pie' | 'table' | 'world_map' | 'big_number' | 'radar'
    queries: QueryConfig[]
    displayConfig?: any
    layout: { x: number; y: number; w: number; h: number }
}> {
    return [
        // 总事件数
        {
            title: '总事件数',
            widgetType: 'big_number',
            queries: [{ id: 'total-events', fields: ['count() as value'], conditions: [{ field: 'app_id', operator: '=', value: appId }] }],
            layout: { x: 0, y: 0, w: 3, h: 2 },
        },

        // 错误总数
        {
            title: '错误总数',
            widgetType: 'big_number',
            queries: [
                {
                    id: 'total-errors',
                    fields: ['count() as value'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'error' },
                    ],
                },
            ],
            layout: { x: 3, y: 0, w: 4, h: 2 },
        },

        // 活跃用户
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
            layout: { x: 0, y: 2, w: 3, h: 2 },
        },

        // 平均 LCP
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
            displayConfig: { unit: 'ms' },
            layout: { x: 3, y: 2, w: 4, h: 2 },
        },

        // 事件类型分布
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
            displayConfig: { showLegend: true },
            layout: { x: 7, y: 0, w: 5, h: 4 },
        },

        // Web Vitals 性能趋势
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
                    legend: 'TTFB',
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
                    legend: 'INP',
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
                    legend: 'FCP',
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
                    legend: 'LCP',
                    color: '#1d4ed8',
                },
            ],
            displayConfig: { yAxis: { unit: 'ms', min: 0 }, showLegend: true },
            layout: { x: 0, y: 4, w: 7, h: 6 },
        },

        // 错误类型分布
        {
            title: '错误类型分布',
            widgetType: 'radar',
            queries: [
                {
                    id: 'error-type-distribution',
                    fields: ['event_name', 'count() as count'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        { field: 'event_type', operator: '=', value: 'error' },
                        { field: 'event_name', operator: '!=', value: '' },
                    ],
                    groupBy: ['event_name'],
                    orderBy: [{ field: 'count()', direction: 'DESC' }],
                    limit: 5,
                },
            ],
            displayConfig: { showLegend: false },
            layout: { x: 7, y: 4, w: 5, h: 6 },
        },
    ]
}
