/**
 * 错误分析查询相关 Hook
 */

import { useQuery } from '@tanstack/react-query'
import { errorsAPI } from '@/api'
import { QUERY_CONFIG } from '@/utils/constants'

/**
 * 查询错误趋势
 */
export function useErrorTrends(params: Parameters<typeof errorsAPI.getTrends>[0]) {
    return useQuery({
        queryKey: ['errorTrends', params],
        queryFn: () => errorsAPI.getTrends(params),
        enabled: !!params.appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 对比错误趋势
 */
export function useCompareErrorTrends(params: Parameters<typeof errorsAPI.compareTrends>[0]) {
    return useQuery({
        queryKey: ['compareErrorTrends', params],
        queryFn: () => errorsAPI.compareTrends(params),
        enabled: !!params.appId && params.fingerprints.length > 0,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 查询智能错误分组
 */
export function useSmartErrorGroups(appId: string | null) {
    return useQuery({
        queryKey: ['smartErrorGroups', appId],
        queryFn: () => errorsAPI.getSmartGroups({ appId: appId! }),
        enabled: !!appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 检测错误突增
 */
export function useDetectSpikes(params: Parameters<typeof errorsAPI.detectSpikes>[0]) {
    return useQuery({
        queryKey: ['detectSpikes', params],
        queryFn: () => errorsAPI.detectSpikes(params),
        enabled: !!params.appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 查询最近的错误突增
 */
export function useRecentSpikes(appId: string | null) {
    return useQuery({
        queryKey: ['recentSpikes', appId],
        queryFn: () => errorsAPI.getRecentSpikes({ appId: appId! }),
        enabled: !!appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}
