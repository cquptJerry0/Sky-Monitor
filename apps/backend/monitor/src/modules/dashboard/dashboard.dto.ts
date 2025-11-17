import { z } from 'zod'

/**
 * 查询条件 Schema
 */
export const queryConditionSchema = z.object({
    field: z.string(),
    operator: z.enum(['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'LIKE']),
    value: z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())]),
})

/**
 * 排序配置 Schema
 */
export const orderByConfigSchema = z.object({
    field: z.string(),
    direction: z.enum(['ASC', 'DESC']),
})

/**
 * 查询配置 Schema
 */
export const queryConfigSchema = z.object({
    id: z.string(),
    fields: z.array(z.string()),
    conditions: z.array(queryConditionSchema),
    groupBy: z.array(z.string()).optional(),
    orderBy: z.array(orderByConfigSchema).optional(),
    limit: z.number().optional(),
    legend: z.string().optional(),
    color: z.string().optional(),
})

/**
 * Y 轴配置 Schema
 */
export const yAxisConfigSchema = z.object({
    unit: z.string().optional(),
    min: z.union([z.number(), z.literal('auto')]).optional(),
    max: z.union([z.number(), z.literal('auto')]).optional(),
    scale: z.enum(['linear', 'log']).optional(),
})

/**
 * 显示配置 Schema
 */
export const displayConfigSchema = z.object({
    yAxis: yAxisConfigSchema.optional(),
    showLegend: z.boolean().optional(),
    showGrid: z.boolean().optional(),
    stacked: z.boolean().optional(),
    // big_number 专用配置
    trend: z.boolean().optional(), // 是否显示趋势
    trendField: z.string().optional(), // 趋势字段
    icon: z.string().optional(), // 图标名称
    color: z.string().optional(), // 颜色
    unit: z.string().optional(), // 单位
    // line/area 专用配置
    smooth: z.boolean().optional(), // 是否平滑曲线
    // bar 专用配置
    horizontal: z.boolean().optional(), // 是否横向柱状图
})

/**
 * 布局配置 Schema
 */
export const layoutConfigSchema = z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
})

/**
 * 创建 Dashboard Schema
 */
export const createDashboardSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    appId: z.string().optional(),
})

export type CreateDashboardDto = z.infer<typeof createDashboardSchema>

/**
 * 更新 Dashboard Schema
 */
export const updateDashboardSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    appId: z.string().optional(),
})

export type UpdateDashboardDto = z.infer<typeof updateDashboardSchema>

/**
 * 删除 Dashboard Schema
 */
export const deleteDashboardSchema = z.object({
    id: z.string().uuid(),
})

export type DeleteDashboardDto = z.infer<typeof deleteDashboardSchema>

/**
 * 创建 Widget Schema
 */
export const createWidgetSchema = z.object({
    dashboardId: z.string().uuid(),
    title: z.string().min(1).max(255),
    widgetType: z.enum(['line', 'bar', 'area', 'table', 'world_map', 'big_number']),
    queries: z.array(queryConfigSchema),
    displayConfig: displayConfigSchema.optional(),
    layout: layoutConfigSchema,
})

export type CreateWidgetDto = z.infer<typeof createWidgetSchema>

/**
 * 更新 Widget Schema
 */
export const updateWidgetSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(255).optional(),
    widgetType: z.enum(['line', 'bar', 'area', 'table', 'world_map', 'big_number']).optional(),
    queries: z.array(queryConfigSchema).optional(),
    displayConfig: displayConfigSchema.optional(),
    layout: layoutConfigSchema.optional(),
})

export type UpdateWidgetDto = z.infer<typeof updateWidgetSchema>

/**
 * 删除 Widget Schema
 */
export const deleteWidgetSchema = z.object({
    id: z.string().uuid(),
})

export type DeleteWidgetDto = z.infer<typeof deleteWidgetSchema>

/**
 * 批量更新 Widget 布局 Schema
 */
export const updateWidgetsLayoutSchema = z.object({
    dashboardId: z.string().uuid(),
    layouts: z.array(
        z.object({
            id: z.string().uuid(),
            layout: layoutConfigSchema,
        })
    ),
})

export type UpdateWidgetsLayoutDto = z.infer<typeof updateWidgetsLayoutSchema>

/**
 * 执行查询 Schema
 */
export const executeQuerySchema = z.object({
    widgetId: z.string().uuid(),
    timeRange: z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
    }),
    appId: z.union([z.string(), z.array(z.string())]).optional(),
})

export type ExecuteQueryDto = z.infer<typeof executeQuerySchema>
