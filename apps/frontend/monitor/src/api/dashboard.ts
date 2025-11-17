import type {
    CreateDashboardDto,
    CreateWidgetDto,
    CreateWidgetFromTemplateDto,
    Dashboard,
    DashboardWidget,
    DeleteDashboardDto,
    DeleteWidgetDto,
    ExecuteQueryDto,
    ExecuteQueryResponse,
    TemplateListResponse,
    UpdateDashboardDto,
    UpdateWidgetDto,
    UpdateWidgetsLayoutDto,
    WidgetTemplateMeta,
} from '@/types/dashboard'

import { client } from './client'

/**
 * Dashboard API
 */
export const dashboardApi = {
    /**
     * 创建 Dashboard
     */
    createDashboard: async (data: CreateDashboardDto): Promise<Dashboard> => {
        return await client.post<Dashboard>('/dashboards', data)
    },

    /**
     * 获取用户的所有 Dashboard
     * @param appId 应用ID (可选,如果提供则只返回该应用的dashboard)
     */
    listDashboards: async (appId?: string): Promise<Dashboard[]> => {
        const params = appId ? { appId } : {}
        return await client.get<Dashboard[]>('/dashboards', { params })
    },

    /**
     * 获取 Dashboard 详情 (包含所有 Widget)
     */
    getDashboard: async (id: string): Promise<Dashboard> => {
        return await client.get<Dashboard>(`/dashboards/${id}`)
    },

    /**
     * 更新 Dashboard
     */
    updateDashboard: async (data: UpdateDashboardDto): Promise<Dashboard> => {
        return await client.put<Dashboard>('/dashboards', data)
    },

    /**
     * 删除 Dashboard
     */
    deleteDashboard: async (data: DeleteDashboardDto): Promise<{ affected: number }> => {
        return await client.delete<{ affected: number }>('/dashboards', { data })
    },

    /**
     * 创建 Widget
     */
    createWidget: async (data: CreateWidgetDto): Promise<DashboardWidget> => {
        return await client.post<DashboardWidget>('/dashboards/widgets', data)
    },

    /**
     * 更新 Widget
     */
    updateWidget: async (data: UpdateWidgetDto): Promise<DashboardWidget> => {
        return await client.put<DashboardWidget>('/dashboards/widgets', data)
    },

    /**
     * 删除 Widget
     */
    deleteWidget: async (data: DeleteWidgetDto): Promise<{ affected: number }> => {
        return await client.delete<{ affected: number }>('/dashboards/widgets', { data })
    },

    /**
     * 批量更新 Widget 布局
     */
    updateWidgetsLayout: async (data: UpdateWidgetsLayoutDto): Promise<{ success: boolean }> => {
        return await client.put<{ success: boolean }>('/dashboards/widgets/layout', data)
    },

    /**
     * 执行查询
     */
    executeQuery: async (data: ExecuteQueryDto): Promise<ExecuteQueryResponse> => {
        return await client.post<ExecuteQueryResponse>('/dashboards/widgets/query', data)
    },

    // ==================== Widget 模板相关 API ====================

    /**
     * 获取所有 Widget 模板
     */
    getTemplates: async (category?: string): Promise<TemplateListResponse> => {
        const params = category ? { category } : {}
        return await client.get<TemplateListResponse>('/dashboards/templates', { params })
    },

    /**
     * 获取单个 Widget 模板
     */
    getTemplateByType: async (type: string): Promise<WidgetTemplateMeta> => {
        return await client.get<WidgetTemplateMeta>(`/dashboards/templates/${type}`)
    },

    /**
     * 从模板创建 Widget
     */
    createWidgetFromTemplate: async (data: CreateWidgetFromTemplateDto): Promise<DashboardWidget> => {
        return await client.post<DashboardWidget>('/dashboards/widgets/from-template', data)
    },
}
