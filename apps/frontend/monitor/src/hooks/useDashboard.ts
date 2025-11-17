/**
 * Dashboard 查询和操作相关 Hook
 *
 * ## 核心功能
 * 1. **Dashboard CRUD**: 创建、读取、更新、删除 Dashboard
 * 2. **Widget CRUD**: 创建、读取、更新、删除 Widget
 * 3. **布局管理**: 更新 Widget 布局 (拖拽和调整大小)
 * 4. **查询执行**: 执行 ClickHouse 查询获取图表数据
 *
 * ## 数据流
 * 1. **Dashboard 列表**: useDashboards() -> GET /dashboards -> Dashboard[]
 * 2. **Dashboard 详情**: useDashboard(id) -> GET /dashboards/:id -> Dashboard (包含 Widgets)
 * 3. **Widget 查询**: useExecuteQuery() -> POST /dashboards/query -> QueryResult
 * 4. **缓存失效**: mutation 成功后自动失效相关查询缓存
 *
 * ## Query Keys 设计
 * - 使用层级结构组织 Query Keys
 * - 支持精确失效和批量失效
 * - 例如: ['dashboards', 'detail', 'dashboard-id'] -> 失效单个 Dashboard
 * - 例如: ['dashboards'] -> 失效所有 Dashboard 相关查询
 *
 * ## 缓存策略
 * - **Dashboard 列表**: 长期缓存，mutation 后失效
 * - **Dashboard 详情**: 长期缓存，mutation 后失效
 * - **Widget 查询**: 不缓存 (staleTime: 0)，每次都重新请求最新数据
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { dashboardApi } from '@/api/dashboard'
import type {
    CreateDashboardDto,
    CreateWidgetDto,
    DeleteDashboardDto,
    DeleteWidgetDto,
    ExecuteQueryDto,
    UpdateDashboardDto,
    UpdateWidgetDto,
    UpdateWidgetsLayoutDto,
} from '@/types/dashboard'

/**
 * Query Keys 工厂函数
 *
 * ## 设计原则
 * - 使用层级结构: ['dashboards'] -> ['dashboards', 'list'] -> ['dashboards', 'detail', id]
 * - 支持精确失效: invalidateQueries({ queryKey: dashboardKeys.detail(id) })
 * - 支持批量失效: invalidateQueries({ queryKey: dashboardKeys.all })
 *
 * ## Query Key 结构
 * - all: ['dashboards'] - 所有 Dashboard 相关查询的根 key
 * - lists: ['dashboards', 'list'] - Dashboard 列表查询
 * - details: ['dashboards', 'detail'] - Dashboard 详情查询的根 key
 * - detail: ['dashboards', 'detail', id] - 单个 Dashboard 详情查询
 * - widgets: ['dashboards', 'detail', id, 'widgets'] - Dashboard 的 Widgets 查询
 * - query: ['dashboards', 'query', widgetId, timeRange, appId] - Widget 查询结果
 */
export const dashboardKeys = {
    all: ['dashboards'] as const,
    lists: () => [...dashboardKeys.all, 'list'] as const,
    list: () => [...dashboardKeys.lists()] as const,
    details: () => [...dashboardKeys.all, 'detail'] as const,
    detail: (id: string) => [...dashboardKeys.details(), id] as const,
    widgets: (dashboardId: string) => [...dashboardKeys.detail(dashboardId), 'widgets'] as const,
    query: (widgetId: string, timeRange: { start: string; end: string }, appId?: string) =>
        [...dashboardKeys.all, 'query', widgetId, timeRange, appId] as const,
}

/**
 * 获取 Dashboard 列表
 *
 * ## 返回数据
 * - Dashboard[]: 所有 Dashboard 列表
 *   - id: Dashboard ID
 *   - name: Dashboard 名称
 *   - description: Dashboard 描述
 *   - widgets: Widget[] (包含所有 Widget 配置)
 *
 * @returns TanStack Query 结果对象
 */
export function useDashboards() {
    return useQuery({
        queryKey: dashboardKeys.list(),
        queryFn: () => dashboardApi.listDashboards(),
    })
}

/**
 * 获取 Dashboard 详情
 *
 * ## 返回数据
 * - Dashboard: 单个 Dashboard 详情
 *   - id: Dashboard ID
 *   - name: Dashboard 名称
 *   - description: Dashboard 描述
 *   - widgets: Widget[] (包含所有 Widget 配置和布局)
 *
 * ## 为什么需要单独查询详情?
 * - 列表可能只返回基本信息，详情包含完整的 Widget 配置
 * - 支持按需加载，减少列表接口的数据量
 *
 * @param id - Dashboard ID
 * @returns TanStack Query 结果对象
 */
export function useDashboard(id: string | null) {
    return useQuery({
        queryKey: dashboardKeys.detail(id || ''),
        queryFn: () => dashboardApi.getDashboard(id!),
        enabled: !!id, // 只有当 id 存在时才执行查询
    })
}

/**
 * 创建 Dashboard
 *
 * ## 缓存失效策略
 * - 成功后失效 Dashboard 列表缓存
 * - 触发列表重新加载，显示新创建的 Dashboard
 *
 * @returns TanStack Query Mutation 对象
 */
export function useCreateDashboard() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateDashboardDto) => dashboardApi.createDashboard(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() })
        },
    })
}

/**
 * 更新 Dashboard
 *
 * ## 缓存失效策略
 * - 失效当前 Dashboard 详情缓存
 * - 失效 Dashboard 列表缓存 (列表中的名称/描述可能变化)
 *
 * @returns TanStack Query Mutation 对象
 */
export function useUpdateDashboard() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateDashboardDto) => dashboardApi.updateDashboard(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(variables.id) })
            queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() })
        },
    })
}

/**
 * 删除 Dashboard
 *
 * ## 缓存失效策略
 * - 失效 Dashboard 列表缓存
 * - Dashboard 详情缓存会自动失效 (因为 enabled: !!id 会阻止查询)
 *
 * @returns TanStack Query Mutation 对象
 */
export function useDeleteDashboard() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: DeleteDashboardDto) => dashboardApi.deleteDashboard(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() })
        },
    })
}

/**
 * 创建 Widget
 *
 * ## 缓存失效策略
 * - 失效当前 Dashboard 详情缓存
 * - 触发 Dashboard 重新加载，显示新创建的 Widget
 *
 * ## 使用场景
 * - WidgetBuilder 组件中创建 Widget
 * - 创建成功后自动关闭弹窗并刷新 Dashboard
 *
 * @returns TanStack Query Mutation 对象
 */
export function useCreateWidget() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateWidgetDto) => dashboardApi.createWidget(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(variables.dashboardId) })
        },
    })
}

/**
 * 更新 Widget
 *
 * ## 缓存失效策略
 * - 失效所有 Dashboard 相关缓存 (因为不知道 Widget 属于哪个 Dashboard)
 * - 更激进的失效策略，确保数据一致性
 *
 * @returns TanStack Query Mutation 对象
 */
export function useUpdateWidget() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateWidgetDto) => dashboardApi.updateWidget(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
        },
    })
}

/**
 * 删除 Widget
 *
 * ## 缓存失效策略
 * - 失效所有 Dashboard 相关缓存
 * - 确保 Dashboard 详情和列表都更新
 *
 * @returns TanStack Query Mutation 对象
 */
export function useDeleteWidget() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: DeleteWidgetDto) => dashboardApi.deleteWidget(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
        },
    })
}

/**
 * 更新 Widget 布局
 *
 * ## 使用场景
 * - DashboardGrid 组件中拖拽 Widget
 * - 调整 Widget 大小
 * - 批量更新多个 Widget 的布局
 *
 * ## 缓存失效策略
 * - 失效当前 Dashboard 详情缓存
 * - 触发 Dashboard 重新加载，显示新的布局
 *
 * ## 性能优化
 * - 使用防抖避免频繁请求
 * - 批量更新多个 Widget 的布局 (一次请求)
 *
 * @returns TanStack Query Mutation 对象
 */
export function useUpdateWidgetsLayout() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateWidgetsLayoutDto) => dashboardApi.updateWidgetsLayout(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(variables.dashboardId) })
        },
    })
}

/**
 * 执行 Widget 查询
 *
 * ## 查询流程
 * 1. 接收 Widget 配置 (queries, timeRange, appId)
 * 2. 后端执行 ClickHouse 查询
 * 3. 返回查询结果 (QueryResult)
 * 4. 前端根据 Widget 类型渲染图表
 *
 * ## 查询配置
 * - fields: 查询字段 (例如: ['count()', 'avg(duration)'])
 * - conditions: 查询条件 (例如: [{ field: 'errorType', operator: '=', value: 'error' }])
 * - groupBy: 分组字段 (例如: ['errorType', 'toStartOfHour(timestamp)'])
 * - timeRange: 时间范围 (start, end)
 * - appId: 应用 ID (过滤条件)
 *
 * ## 返回数据
 * - QueryResult: 查询结果
 *   - data: QueryResultDataPoint[] - 数据点数组
 *   - columns: string[] - 列名
 *   - rows: number - 行数
 *
 * ## 缓存策略
 * - staleTime: 0 - 不缓存，每次都重新请求
 * - refetchInterval: false - 不自动刷新
 * - 原因: Dashboard 数据实时性要求高，避免显示过期数据
 *
 * @param data - 查询配置
 * @returns TanStack Query 结果对象
 */
export function useExecuteQuery(data: ExecuteQueryDto | null) {
    return useQuery({
        queryKey: dashboardKeys.query(
            data?.widgetId || '',
            data?.timeRange || { start: '', end: '' },
            Array.isArray(data?.appId) ? data.appId[0] : data?.appId
        ),
        queryFn: () => dashboardApi.executeQuery(data!),
        enabled: !!data && !!data.widgetId && !!data.timeRange.start && !!data.timeRange.end,
        refetchInterval: false,
        staleTime: 0, // 不缓存，每次都重新请求最新数据
    })
}
