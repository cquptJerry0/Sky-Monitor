/**
 * 应用管理查询相关 Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsAPI } from '@/api'

/**
 * 查询应用列表
 */
export function useApplications() {
    return useQuery({
        queryKey: ['applications'],
        queryFn: () => applicationsAPI.list(),
        staleTime: 60_000, // 1 分钟
    })
}

/**
 * 创建应用
 */
export function useCreateApplication() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: applicationsAPI.create,
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
        mutationFn: applicationsAPI.update,
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
        mutationFn: applicationsAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applications'] })
        },
    })
}
