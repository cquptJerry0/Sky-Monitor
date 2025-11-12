/**
 * 事件查询相关 Hook
 */

import { useQuery } from '@tanstack/react-query'
import { eventsAPI } from '@/api'
import { QUERY_CONFIG } from '@/utils/constants'

/**
 * 查询事件列表
 */
export function useEvents(params: Parameters<typeof eventsAPI.list>[0]) {
    return useQuery({
        queryKey: ['events', params],
        queryFn: () => eventsAPI.list(params),
        enabled: !!params.appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
        gcTime: QUERY_CONFIG.GC_TIME,
        retry: QUERY_CONFIG.RETRY,
    })
}

/**
 * 查询事件统计
 */
export function useEventStats(appId: string | null, timeRange?: { start: Date; end: Date }) {
    return useQuery({
        queryKey: ['eventStats', appId, timeRange],
        queryFn: () =>
            eventsAPI.getStats({
                appId: appId || undefined,
                startTime: timeRange?.start.toISOString(),
                endTime: timeRange?.end.toISOString(),
            }),
        enabled: !!appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 查询事件详情
 */
export function useEventDetail(id: string | null) {
    return useQuery({
        queryKey: ['event', id],
        queryFn: () => eventsAPI.getById(id!),
        enabled: !!id,
    })
}

/**
 * 查询应用摘要
 */
export function useAppSummary(appId: string | null) {
    return useQuery({
        queryKey: ['appSummary', appId],
        queryFn: () => eventsAPI.getAppSummary(appId!),
        enabled: !!appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 查询会话列表
 */
export function useSessions(params: Parameters<typeof eventsAPI.getSessions>[0]) {
    return useQuery({
        queryKey: ['sessions', params],
        queryFn: async () => {
            const response = await eventsAPI.getSessions(params)
            return response.data
        },
        enabled: !!params.appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 查询会话事件
 */
export function useSessionEvents(sessionId: string | null, appId: string | null) {
    return useQuery({
        queryKey: ['sessionEvents', sessionId, appId],
        queryFn: async () => {
            const response = await eventsAPI.getSessionEvents(sessionId!, appId!)
            return response.data
        },
        enabled: !!sessionId && !!appId,
    })
}

/**
 * 查询慢请求
 */
export function useSlowRequests(params: Parameters<typeof eventsAPI.getSlowRequests>[0]) {
    return useQuery({
        queryKey: ['slowRequests', params],
        queryFn: async () => {
            const response = await eventsAPI.getSlowRequests(params)
            return Array.isArray(response) ? response : []
        },
        enabled: !!params.appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 查询错误分组
 */
export function useErrorGroups(params: Parameters<typeof eventsAPI.getErrorGroups>[0]) {
    return useQuery({
        queryKey: ['errorGroups', params],
        queryFn: async () => {
            const response = await eventsAPI.getErrorGroups(params)
            return Array.isArray(response) ? response : []
        },
        enabled: !!params.appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 查询 SourceMap 状态
 */
export function useSourceMapStatuses(eventIds: string[]) {
    return useQuery({
        queryKey: ['sourceMapStatuses', eventIds],
        queryFn: () => eventsAPI.getSourceMapStatuses(eventIds),
        enabled: eventIds.length > 0,
        staleTime: 10_000, // 10 秒
    })
}
