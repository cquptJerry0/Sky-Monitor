/**
 * Dashboard 类型定义
 */

export type WidgetType = 'line' | 'bar' | 'area' | 'table' | 'big_number'

export interface QueryCondition {
    field: string
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'LIKE'
    value: string | number | string[] | number[]
}

export interface QueryConfig {
    id: string
    fields: string[]
    conditions?: QueryCondition[]
    groupBy?: string[]
    orderBy?: Array<{ field: string; direction: 'ASC' | 'DESC' }>
    limit?: number
    legend?: string
    color?: string
}

export interface YAxisConfig {
    unit?: string
    min?: number | 'auto'
    max?: number | 'auto'
    scale?: 'linear' | 'log'
}

export interface DisplayConfig {
    yAxis?: YAxisConfig
    showLegend?: boolean
    showGrid?: boolean
    stacked?: boolean
}

export interface LayoutConfig {
    x: number
    y: number
    w: number
    h: number
}

export interface Dashboard {
    id: string
    name: string
    description?: string
    isDefault: boolean
    userId: number
    createdAt: string
    updatedAt: string
    widgets?: DashboardWidget[]
}

export interface DashboardWidget {
    id: string
    dashboardId: string
    title: string
    widgetType: WidgetType
    queries: QueryConfig[]
    displayConfig?: DisplayConfig
    layout: LayoutConfig
    createdAt: string
    updatedAt: string
}

export interface CreateDashboardDto {
    name: string
    description?: string
    isDefault?: boolean
}

export interface UpdateDashboardDto {
    id: string
    name?: string
    description?: string
    isDefault?: boolean
}

export interface DeleteDashboardDto {
    id: string
}

export interface CreateWidgetDto {
    dashboardId: string
    title: string
    widgetType: WidgetType
    queries: QueryConfig[]
    displayConfig?: DisplayConfig
    layout: LayoutConfig
}

export interface UpdateWidgetDto {
    id: string
    title?: string
    widgetType?: WidgetType
    queries?: QueryConfig[]
    displayConfig?: DisplayConfig
    layout?: LayoutConfig
}

export interface DeleteWidgetDto {
    id: string
}

export interface UpdateWidgetsLayoutDto {
    dashboardId: string
    layouts: Array<{
        id: string
        layout: LayoutConfig
    }>
}

export interface ExecuteQueryDto {
    widgetId: string
    timeRange: {
        start: string
        end: string
    }
    appId?: string
}

export interface QueryResult {
    queryId: string
    legend?: string
    color?: string
    data: any[]
}

export interface ExecuteQueryResponse {
    widgetId: string
    widgetType: WidgetType
    title: string
    results: QueryResult[]
}
