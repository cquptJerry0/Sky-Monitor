/**
 * 应用管理相关 API
 */

import { client } from '../client'
import type { ApplicationType, Application } from '../types'

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
 * 应用列表数据类型
 * 注意：响应拦截器已经解包了 response.data.data，所以这里的类型是解包后的数据
 */
export interface ApplicationListData {
    applications: Application[]
    count: number
}

export const applicationsAPI = {
    /**
     * 获取应用列表
     * 后端返回: { success: true, data: { applications: [...], count: 2 } }
     * 响应拦截器解包后: { applications: [...], count: 2 }
     */
    list: () => client.get<ApplicationListData>('/application'),

    /**
     * 创建应用
     * 后端返回: { success: true, data: Application }
     * 响应拦截器解包后: Application
     */
    create: (data: CreateApplicationRequest) => client.post<Application>('/application', data),

    /**
     * 更新应用
     * 后端返回: { success: true, data: Application }
     * 响应拦截器解包后: Application
     */
    update: (data: UpdateApplicationRequest) => client.put<Application>('/application', data),

    /**
     * 删除应用
     * 后端返回: { success: true, data: null }
     * 响应拦截器解包后: null
     */
    delete: (data: DeleteApplicationRequest) => client.delete<null>('/application', { data }),
}
