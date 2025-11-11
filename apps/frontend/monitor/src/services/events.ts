import {
    EventsListRes,
    EventStatsRes,
    MonitorEvent,
    FetchHttpErrorsParams,
    HttpErrorsListRes,
    FetchResourceErrorsParams,
    ResourceErrorsListRes,
    FetchWebVitalsParams,
    WebVitalsListRes,
    FetchResourceTimingParams,
    ResourceTimingListRes,
    FetchAlertsParams,
    AlertsListRes,
} from '@/types/api'
import { request } from '@/utils/request'

/**
 * 获取事件列表
 */
export const fetchEvents = async (params?: {
    appId?: string
    eventType?: string
    limit?: number
    offset?: number
    startTime?: string
    endTime?: string
}): Promise<EventsListRes> => {
    return await request.get('/events', { params })
}

/**
 * 获取事件详情
 */
export const fetchEventById = async (id: string): Promise<{ data: MonitorEvent }> => {
    return await request.get(`/events/${id}`)
}

/**
 * 获取统计数据
 */
export const fetchEventStats = async (params?: { appId?: string; startTime?: string; endTime?: string }): Promise<EventStatsRes> => {
    return await request.get('/events/stats/summary', { params })
}

/**
 * 获取应用事件摘要
 */
export const fetchAppSummary = async (appId: string) => {
    return await request.get(`/events/app/${appId}/summary`)
}

/**
 * 获取HTTP错误列表
 */
export const fetchHttpErrors = async (params: FetchHttpErrorsParams): Promise<HttpErrorsListRes> => {
    const response = await request.get('/events', {
        params: {
            ...params,
            eventType: 'error',
        },
    })

    const filteredData = response.data.data.filter((event: any) => event.http_url && event.http_url !== '')

    return {
        success: true,
        data: {
            data: filteredData,
            total: filteredData.length,
            limit: params.limit || 50,
            offset: params.offset || 0,
        },
    }
}

/**
 * 获取资源错误列表
 */
export const fetchResourceErrors = async (params: FetchResourceErrorsParams): Promise<ResourceErrorsListRes> => {
    const response = await request.get('/events', {
        params: {
            ...params,
            eventType: 'error',
        },
    })

    const filteredData = response.data.data.filter((event: any) => event.resource_url && event.resource_url !== '')

    return {
        success: true,
        data: {
            data: filteredData,
            total: filteredData.length,
            limit: params.limit || 50,
            offset: params.offset || 0,
        },
    }
}

/**
 * 获取Web Vitals数据
 */
export const fetchWebVitals = async (params: FetchWebVitalsParams): Promise<WebVitalsListRes> => {
    const response = await request.get('/events', {
        params: {
            ...params,
            eventType: 'webVital',
        },
    })

    return {
        success: true,
        data: response.data,
    }
}

/**
 * 获取会话回放数据
 */
export const fetchSessionReplay = async (sessionId: string, appId?: string) => {
    return await request.get(`/events/sessions/${sessionId}`, {
        params: { appId },
    })
}

/**
 * 获取资源加载性能数据
 */
export const fetchResourceTiming = async (params: FetchResourceTimingParams): Promise<ResourceTimingListRes> => {
    const response = await request.get('/events', {
        params: {
            ...params,
            eventType: 'performance',
        },
    })

    const filteredData = response.data.data.filter((event: any) => {
        try {
            const eventData = typeof event.event_data === 'string' ? JSON.parse(event.event_data) : event.event_data
            return eventData.category === 'resourceTiming'
        } catch {
            return false
        }
    })

    return {
        success: true,
        data: {
            data: filteredData,
            total: filteredData.length,
            limit: params.limit || 50,
            offset: params.offset || 0,
        },
    }
}

/**
 * 获取错误峰值分析数据（用于错误分析页面）
 */
export const fetchErrorSpikes = async (params: FetchAlertsParams): Promise<AlertsListRes> => {
    return await request.get('/error-analytics/recent-spikes', { params })
}
