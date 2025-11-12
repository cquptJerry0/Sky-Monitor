/**
 * 应用管理相关 API
 */

import { client } from '../client'
import type { Application, ApplicationType } from '../types'

export const applicationsAPI = {
    /**
     * 获取应用列表
     */
    list: () => client.get<{ applications: Application[] }>('/application'),

    /**
     * 创建应用
     */
    create: (data: { name: string; type: ApplicationType; description?: string }) => client.post<Application>('/application', data),

    /**
     * 更新应用
     */
    update: (data: { appId: string; name?: string; description?: string }) => client.put<Application>('/application', data),

    /**
     * 删除应用
     */
    delete: (appId: string) => client.delete('/application', { data: { appId } }),
}
