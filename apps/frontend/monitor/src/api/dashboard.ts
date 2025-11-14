import type {
    CreateDashboardDto,
    CreateWidgetDto,
    Dashboard,
    DashboardWidget,
    DeleteDashboardDto,
    DeleteWidgetDto,
    ExecuteQueryDto,
    ExecuteQueryResponse,
    UpdateDashboardDto,
    UpdateWidgetDto,
    UpdateWidgetsLayoutDto,
} from '@/types/dashboard'

import { request } from './request'

/**
 * Dashboard API
 */
export const dashboardApi = {
    /**
     * 创建 Dashboard
     */
    createDashboard: async (data: CreateDashboardDto): Promise<Dashboard> => {
        const response = await request.post<{ data: Dashboard }>('/dashboards', data)
        return response.data
    },

    /**
     * 获取用户的所有 Dashboard
     */
    listDashboards: async (): Promise<Dashboard[]> => {
        const response = await request.get<{ data: Dashboard[] }>('/dashboards')
        return response.data
    },

    /**
     * 获取 Dashboard 详情 (包含所有 Widget)
     */
    getDashboard: async (id: string): Promise<Dashboard> => {
        const response = await request.get<{ data: Dashboard }>(`/dashboards/${id}`)
        return response.data
    },

    /**
     * 更新 Dashboard
     */
    updateDashboard: async (data: UpdateDashboardDto): Promise<Dashboard> => {
        const response = await request.put<{ data: Dashboard }>('/dashboards', data)
        return response.data
    },

    /**
     * 删除 Dashboard
     */
    deleteDashboard: async (data: DeleteDashboardDto): Promise<{ affected: number }> => {
        const response = await request.delete<{ data: { affected: number } }>('/dashboards', { data })
        return response.data
    },

    /**
     * 创建 Widget
     */
    createWidget: async (data: CreateWidgetDto): Promise<DashboardWidget> => {
        const response = await request.post<{ data: DashboardWidget }>('/dashboards/widgets', data)
        return response.data
    },

    /**
     * 更新 Widget
     */
    updateWidget: async (data: UpdateWidgetDto): Promise<DashboardWidget> => {
        const response = await request.put<{ data: DashboardWidget }>('/dashboards/widgets', data)
        return response.data
    },

    /**
     * 删除 Widget
     */
    deleteWidget: async (data: DeleteWidgetDto): Promise<{ affected: number }> => {
        const response = await request.delete<{ data: { affected: number } }>('/dashboards/widgets', { data })
        return response.data
    },

    /**
     * 批量更新 Widget 布局
     */
    updateWidgetsLayout: async (data: UpdateWidgetsLayoutDto): Promise<{ success: boolean }> => {
        const response = await request.put<{ data: { success: boolean } }>('/dashboards/widgets/layout', data)
        return response.data
    },

    /**
     * 执行查询
     */
    executeQuery: async (data: ExecuteQueryDto): Promise<ExecuteQueryResponse> => {
        const response = await request.post<{ data: ExecuteQueryResponse }>('/dashboards/widgets/query', data)
        return response.data
    },
}
