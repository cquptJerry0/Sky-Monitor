import { ErrorEvent, ErrorGroup, ErrorsListRes, ErrorTrend, ErrorTrendsRes, FetchErrorsParams, SmartErrorGroupsRes } from '@/types/api'
import { request } from '@/utils/request'

export const fetchErrors = async (params?: FetchErrorsParams): Promise<ErrorsListRes> => {
    return await request.get('/events', {
        params: {
            ...params,
            eventType: 'error',
        },
    })
}

export const fetchErrorDetail = async (errorId: string): Promise<{ success: boolean; data: ErrorEvent }> => {
    return await request.get(`/events/${errorId}`)
}

export const fetchErrorTrends = async (params: {
    appId: string
    window?: 'hour' | 'day' | 'week'
    fingerprint?: string
    limit?: number
}): Promise<ErrorTrendsRes> => {
    return await request.get('/error-analytics/trends', { params })
}

export const compareErrorTrends = async (params: {
    appId: string
    fingerprints: string[]
    window?: 'hour' | 'day' | 'week'
    limit?: number
}): Promise<{ success: boolean; data: Record<string, ErrorTrend[]> }> => {
    return await request.get('/error-analytics/trends/compare', {
        params: {
            ...params,
            fingerprints: params.fingerprints.join(','),
        },
    })
}

export const fetchSmartErrorGroups = async (params: {
    appId: string
    threshold?: number
    limit?: number
}): Promise<SmartErrorGroupsRes> => {
    return await request.get('/error-analytics/smart-groups', { params })
}

export const detectErrorSpikes = async (params: {
    appId: string
    window?: 'hour' | 'day'
    lookback?: number
}): Promise<{
    success: boolean
    data: {
        isSpike: boolean
        currentCount: number
        avgCount: number
        stdDev: number
        threshold: number
        spikeRatio?: number
    }
}> => {
    return await request.get('/error-analytics/spike-detection', { params })
}

export const fetchRecentSpikes = async (params: {
    appId: string
    limit?: number
}): Promise<{
    success: boolean
    data: Array<{
        timestamp: string
        currentCount: number
        avgCount: number
        spikeRatio: number
    }>
}> => {
    return await request.get('/error-analytics/recent-spikes', { params })
}
