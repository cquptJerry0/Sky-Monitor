/**
 * Dashboard 类型定义
 *
 * 包含 Dashboard 和 Widget 相关的所有类型定义
 * 用于自定义监控仪表盘功能
 */

/**
 * Widget 可视化类型
 */
export type WidgetType = 'line' | 'bar' | 'area' | 'table' | 'big_number'

/**
 * 查询条件
 */
export interface QueryCondition {
    field: string
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'LIKE'
    value: string | number | string[] | number[]
}

/**
 * 查询配置
 */
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

/**
 * Y 轴配置
 */
export interface YAxisConfig {
    unit?: string
    min?: number | 'auto'
    max?: number | 'auto'
    scale?: 'linear' | 'log'
}

/**
 * 显示配置
 */
export interface DisplayConfig {
    yAxis?: YAxisConfig
    showLegend?: boolean
    showGrid?: boolean
    stacked?: boolean
}

/**
 * 布局配置
 */
export interface LayoutConfig {
    x: number
    y: number
    w: number
    h: number
}

/**
 * Dashboard 实体
 */
export interface Dashboard {
    id: string
    name: string
    description?: string
    isDefault: boolean
    userId: number
    appId?: string
    createdAt: string
    updatedAt: string
    widgets?: DashboardWidget[]
}

/**
 * Dashboard Widget 实体
 */
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

/**
 * 创建 Dashboard DTO
 */
export interface CreateDashboardDto {
    name: string
    description?: string
    isDefault?: boolean
    appId?: string
}

/**
 * 更新 Dashboard DTO
 */
export interface UpdateDashboardDto {
    id: string
    name?: string
    description?: string
    isDefault?: boolean
    appId?: string
}

/**
 * 删除 Dashboard DTO
 */
export interface DeleteDashboardDto {
    id: string
}

/**
 * 创建 Widget DTO
 */
export interface CreateWidgetDto {
    dashboardId: string
    title: string
    widgetType: WidgetType
    queries: QueryConfig[]
    displayConfig?: DisplayConfig
    layout: LayoutConfig
}

/**
 * 更新 Widget DTO
 */
export interface UpdateWidgetDto {
    id: string
    title?: string
    widgetType?: WidgetType
    queries?: QueryConfig[]
    displayConfig?: DisplayConfig
    layout?: LayoutConfig
}

/**
 * 删除 Widget DTO
 */
export interface DeleteWidgetDto {
    id: string
}

/**
 * 更新 Widgets 布局 DTO
 */
export interface UpdateWidgetsLayoutDto {
    dashboardId: string
    layouts: Array<{
        id: string
        layout: LayoutConfig
    }>
}

/**
 * 执行查询 DTO
 */
export interface ExecuteQueryDto {
    widgetId: string
    timeRange: {
        start: string
        end: string
    }
    appId?: string
}

/**
 * 查询结果数据点（用于图表）
 * 使用索引签名支持动态字段，但保证基础字段类型安全
 */
export interface QueryResultDataPoint {
    /** 时间戳或分类名称 */
    name?: string
    /** 时间戳（毫秒） */
    time?: number
    /** 标签 */
    label?: string
    /** 动态数据字段 */
    [key: string]: string | number | undefined
}

/**
 * 查询结果
 */
export interface QueryResult {
    queryId: string
    legend?: string
    color?: string
    /** 查询结果数据数组 */
    data: QueryResultDataPoint[]
}

/**
 * 执行查询响应
 */
export interface ExecuteQueryResponse {
    widgetId: string
    widgetType: WidgetType
    title: string
    results: QueryResult[]
}
