/**
 * 告警查询相关 Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsAPI } from '@/api'
import { QUERY_CONFIG } from '@/utils/constants'

/**
 * 查询告警规则列表
 */
export function useAlertRules(params?: Parameters<typeof alertsAPI.getRules>[0]) {
    return useQuery({
        queryKey: ['alertRules', params],
        queryFn: () => alertsAPI.getRules(params),
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 查询告警规则详情
 */
export function useAlertRule(id: string | null) {
    return useQuery({
        queryKey: ['alertRule', id],
        queryFn: () => alertsAPI.getRule(id!),
        enabled: !!id,
    })
}

/**
 * 创建告警规则
 */
export function useCreateAlertRule() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: alertsAPI.createRule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertRules'] })
        },
    })
}

/**
 * 更新告警规则
 */
export function useUpdateAlertRule() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof alertsAPI.updateRule>[1] }) => alertsAPI.updateRule(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertRules'] })
        },
    })
}

/**
 * 删除告警规则
 */
export function useDeleteAlertRule() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: alertsAPI.deleteRule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertRules'] })
        },
    })
}

/**
 * 查询告警历史
 */
export function useAlertHistory(params?: Parameters<typeof alertsAPI.getHistory>[0]) {
    return useQuery({
        queryKey: ['alertHistory', params],
        queryFn: () => alertsAPI.getHistory(params),
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}
