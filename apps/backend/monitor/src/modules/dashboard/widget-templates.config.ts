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
function getAppIdConditions(appId: string | string[]) {
    if (Array.isArray(appId)) {
        return appId.map(id => ({ field: 'app_id', operator: '=' as const, value: id }))
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
}
