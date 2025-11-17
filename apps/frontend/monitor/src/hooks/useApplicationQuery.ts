/**
 * 应用管理查询相关 Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsAPI } from '@/api'
import type { Application } from '@/api/types'
import type { CreateApplicationRequest, UpdateApplicationRequest, DeleteApplicationRequest } from '@/api/endpoints/applications'

/**
 * 查询应用列表
 * 返回: Application[] (已解析)
 */
export function useApplications() {
    return useQuery({
        queryKey: ['applications'],
        queryFn: async (): Promise<Application[]> => {
            const response = await applicationsAPI.list()
            // 响应拦截器已经解包了 response.data.data，所以 response 就是 { applications: [...], count: 2 }
            return response.applications
        },
        staleTime: 60_000, // 1 分钟
    })
}

/**
 * 创建应用
 */
export function useCreateApplication() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: CreateApplicationRequest): Promise<Application> => {
            const response = await applicationsAPI.create(data)
            // 响应拦截器已经解包，response 就是 Application 对象
            return response
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applications'] })
        },
    })
}

/**
 * 更新应用
 */
export function useUpdateApplication() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: UpdateApplicationRequest): Promise<Application> => {
            const response = await applicationsAPI.update(data)
            // 响应拦截器已经解包，response 就是 Application 对象
            return response
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applications'] })
        },
    })
}

/**
 * 删除应用
 */
export function useDeleteApplication() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: DeleteApplicationRequest): Promise<void> => {
            const response = await applicationsAPI.delete(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applications'] })
        },
    })
}
