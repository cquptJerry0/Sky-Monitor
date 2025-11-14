/**
 * 事件查询相关 Hook
 */

import { useQuery } from '@tanstack/react-query'
import { eventsAPI } from '@/api'
import { QUERY_CONFIG } from '@/utils/constants'

/**
 * 查询事件列表
 */
export function useEvents(params: Parameters<typeof eventsAPI.list>[0] & { refetchInterval?: number }) {
    const { refetchInterval, ...apiParams } = params
    return useQuery({
        queryKey: ['events', apiParams],
        queryFn: () => eventsAPI.list(apiParams),
        enabled: !!apiParams.appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
        gcTime: QUERY_CONFIG.GC_TIME,
        retry: QUERY_CONFIG.RETRY,
        refetchInterval: refetchInterval,
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
 * 后端返回: { success: true, data: Event[] }
 * 响应拦截器解包后: Event[]
 */
export function useSlowRequests(params: Parameters<typeof eventsAPI.getSlowRequests>[0]) {
    return useQuery({
        queryKey: ['slowRequests', params],
        queryFn: () => eventsAPI.getSlowRequests(params),
        enabled: !!params.appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 查询错误分组
 * 后端返回: { success: true, data: Event[] }
 * 响应拦截器解包后: Event[]
 */
export function useErrorGroups(params: Parameters<typeof eventsAPI.getErrorGroups>[0]) {
    return useQuery({
        queryKey: ['errorGroups', params],
        queryFn: () => eventsAPI.getErrorGroups(params),
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

/**
 * 查询采样率统计
 * 后端返回: { success: true, data: { sampled: number, total: number, rate: number } }
 * 响应拦截器解包后: { sampled: number, total: number, rate: number }
 */
export function useSamplingStats(appId: string | null) {
    return useQuery({
        queryKey: ['samplingStats', appId],
        queryFn: () => eventsAPI.getSamplingStats(appId!),
        enabled: !!appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 查询用户事件时间线
 * 后端返回: { success: true, data: { data: Event[] } }
 * 响应拦截器解包后: { data: Event[] }
 */
export function useUserEvents(userId: string | null, appId: string | null) {
    return useQuery({
        queryKey: ['userEvents', userId, appId],
        queryFn: () => eventsAPI.getUserEvents(userId!, { appId: appId! }),
        enabled: !!userId && !!appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 查询 Transaction 事件列表
 * 后端返回: { success: true, data: { data: Event[], total: number } }
 * 响应拦截器解包后: { data: Event[], total: number }
 */
export function useTransactions(appId: string | null) {
    return useQuery({
        queryKey: ['transactions', appId],
        queryFn: () => eventsAPI.list({ appId: appId!, eventType: 'transaction', limit: 100 }),
        enabled: !!appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}
