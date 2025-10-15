import { ApplicationListRes, CreateApplicationPayload } from '@/types/api'
import { request } from '@/utils/request'

/**
 * 获取应用列表
 * @returns
 */
export const fetchApplicationList = async (): Promise<ApplicationListRes> => {
    return await request.get('/application')
}

/**
 * 删除应用
 * @param data
 * @returns
 */
export const removeApplication = async (appId: string) => {
    return await request.delete(`/application`, { data: { appId } })
}

/**
 * 创建应用
 * @param data
 * @returns
 */
export const createApplication = async (data: CreateApplicationPayload) => {
    return await request.post('/application', data)
}
