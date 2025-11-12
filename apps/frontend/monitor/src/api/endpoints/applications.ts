/**
 * 应用管理相关 API
 */

import { client } from '../client'
import type { ApplicationType, ApplicationListResponse, ApplicationResponse, DeleteResponse } from '../types'

/**
 * 创建应用请求参数
 */
export interface CreateApplicationRequest {
    name: string
    type: ApplicationType
    description?: string
}

/**
 * 更新应用请求参数
 */
export interface UpdateApplicationRequest {
    appId: string
    name?: string
    description?: string
}

/**
 * 删除应用请求参数
 */
export interface DeleteApplicationRequest {
    appId: string
}

/**
 * 应用列表数据类型（用于类型导出）
 */
export type ApplicationListData = ApplicationListResponse['data']

export const applicationsAPI = {
    /**
     * 获取应用列表
     * 响应格式: { success: true, data: { applications: [...], count: 2 } }
     */
    list: () => client.get<ApplicationListResponse>('/application'),

    /**
     * 创建应用
     * 响应格式: { success: true, data: Application }
     */
    create: (data: CreateApplicationRequest) => client.post<ApplicationResponse>('/application', data),

    /**
     * 更新应用
     * 响应格式: { success: true, data: Application }
     */
    update: (data: UpdateApplicationRequest) => client.put<ApplicationResponse>('/application', data),

    /**
     * 删除应用
     * 响应格式: { success: true, data: null }
     */
    delete: (data: DeleteApplicationRequest) => client.delete<DeleteResponse>('/application', { data }),
}
