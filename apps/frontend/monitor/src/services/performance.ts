import {
    FetchPerformanceParams,
    PerformanceEvent,
    PerformanceListRes,
    PerformanceSummary,
    PerformanceSummaryRes,
    SlowRequest,
    SlowRequestsRes,
    PerformanceData,
    WebVital,
    ResourceTimingData,
} from '@/types/api'
import { request } from '@/utils/request'

export const fetchPerformanceEvents = async (params?: FetchPerformanceParams): Promise<PerformanceListRes> => {
    return await request.get('/events', {
        params: {
            ...params,
            eventType: 'performance',
        },
    })
}

export const fetchPerformanceDetail = async (eventId: string): Promise<{ success: boolean; data: PerformanceEvent }> => {
    return await request.get(`/events/${eventId}`)
}

export const fetchPerformance = async (appId: string): Promise<{ data: PerformanceData[] }> => {
    return await request.get('/performance', {
        params: { appId },
    })
}

export const fetchWebVitals = async (appId: string): Promise<{ data: WebVital[] }> => {
    return await request.get('/performance/web-vitals', {
        params: { appId },
    })
}

export const fetchResourceTiming = async (appId: string): Promise<{ data: ResourceTimingData[] }> => {
    return await request.get('/performance/resource-timing', {
        params: { appId },
    })
}

export const fetchPerformanceMetrics = async (params: {
    appId: string | null
}): Promise<{
    data: {
        fcp: number
        lcp: number
        fid: number
        cls: number
        ttfb?: number
    }
}> => {
    return await request.get('/events/stats/performance', { params })
}

export const fetchPerformanceSummary = async (params: {
    appId: string
    timeWindow?: 'hour' | 'day' | 'week'
}): Promise<PerformanceSummaryRes> => {
    return await request.get('/events/performance/summary', { params })
}

export const fetchSlowRequests = async (params: { appId: string; limit?: number }): Promise<SlowRequestsRes> => {
    return await request.get('/events/performance/slow-requests', { params })
}

export const fetchPerformanceTrends = async (params: {
    appId: string
    window?: 'hour' | 'day' | 'week'
    limit?: number
}): Promise<{
    success: boolean
    data: Array<{
        time_bucket: string
        avg_duration: number
        p50_duration: number
        p95_duration: number
        p99_duration: number
        count: number
    }>
}> => {
    return await request.get('/events/performance/trends', { params })
}
