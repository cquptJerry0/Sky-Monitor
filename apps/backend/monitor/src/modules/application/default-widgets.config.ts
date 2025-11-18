import type { CreateWidgetDto } from '../dashboard/dashboard.dto'

/**
 * 默认 Widget 配置
 * 为每个新创建的 Application 自动生成这些 Widget
 *
 * 新布局设计 (12列 x 10行):
 * 第一行 (h: 4):
 *   - 左侧 (w: 7): 4个关键指标 2x2 网格
 *   - 右侧 (w: 5): 事件类型分布饼图
 * 第二行 (h: 6):
 *   - 左侧 (w: 7): Web Vitals 性能趋势
 *   - 右侧 (w: 5): 错误类型雷达图
 */

/**
 * 生成默认 Widget 配置
 * @param _dashboardId Dashboard ID (保留参数以保持接口兼容)
 * @param appId Application ID
 * @returns 默认 Widget 配置数组
 */
export function generateDefaultWidgets(_dashboardId: string, appId: string): Omit<CreateWidgetDto, 'dashboardId'>[] {
    return [
        // 第一行左侧: 4个关键指标卡片 (2x2网格, 共7列宽)
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
            layout: { x: 0, y: 0, w: 3, h: 2 },
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
            layout: { x: 3, y: 0, w: 4, h: 2 },
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
            layout: { x: 0, y: 2, w: 3, h: 2 },
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
            layout: { x: 3, y: 2, w: 4, h: 2 },
        },

        // 第一行右侧: 事件类型分布饼图
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
            layout: { x: 7, y: 0, w: 5, h: 4 },
        },

        // 第二行左侧: Web Vitals 性能趋势 (7列宽)
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
            layout: { x: 0, y: 4, w: 7, h: 6 },
        },

        // 第二行右侧: 错误类型雷达图
        {
            title: '错误类型分布',
            widgetType: 'radar',
            queries: [
                {
                    id: 'error-type-distribution',
                    fields: ['event_type', 'count() as count'],
                    conditions: [
                        { field: 'app_id', operator: '=', value: appId },
                        {
                            field: 'event_type',
                            operator: 'IN',
                            value: ['error', 'exception', 'unhandledrejection', 'network', 'timeout'],
                        },
                    ],
                    groupBy: ['event_type'],
                    orderBy: [{ field: 'count()', direction: 'DESC' }],
                    limit: 5,
                },
            ],
            displayConfig: {
                showLegend: false,
            },
            layout: { x: 7, y: 4, w: 5, h: 6 },
        },
    ]
}
