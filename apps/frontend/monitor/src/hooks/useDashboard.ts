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
 * Query Keys
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
 */
export function useDashboards() {
    return useQuery({
        queryKey: dashboardKeys.list(),
        queryFn: () => dashboardApi.listDashboards(),
    })
}

/**
 * 获取 Dashboard 详情
 */
export function useDashboard(id: string | null) {
    return useQuery({
        queryKey: dashboardKeys.detail(id || ''),
        queryFn: () => dashboardApi.getDashboard(id!),
        enabled: !!id,
    })
}

/**
 * 创建 Dashboard
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
 * 执行查询
 */
export function useExecuteQuery(data: ExecuteQueryDto | null) {
    return useQuery({
        queryKey: dashboardKeys.query(data?.widgetId || '', data?.timeRange || { start: '', end: '' }, data?.appId),
        queryFn: () => dashboardApi.executeQuery(data!),
        enabled: !!data && !!data.widgetId && !!data.timeRange.start && !!data.timeRange.end,
        refetchInterval: false,
        staleTime: 0,
    })
}
