/**
 * 会话查询相关 Hook
 */

import { useQuery } from '@tanstack/react-query'
import { sessionsAPI } from '@/api'
import { QUERY_CONFIG } from '@/utils/constants'

/**
 * 查询会话统计
 */
export function useSessionStats(params: Parameters<typeof sessionsAPI.getStats>[0]) {
    return useQuery({
        queryKey: ['sessionStats', params],
        queryFn: () => sessionsAPI.getStats(params),
        enabled: !!params.appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 查询会话回放数据
 */
export function useSessionReplay(sessionId: string | null, appId: string | null) {
    return useQuery({
        queryKey: ['sessionReplay', sessionId, appId],
        queryFn: () => sessionsAPI.getReplay(sessionId!, appId!),
        enabled: !!sessionId && !!appId,
        staleTime: 60_000, // 1 分钟
    })
}
