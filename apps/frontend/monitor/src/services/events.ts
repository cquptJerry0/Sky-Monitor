import { EventsListRes, EventStatsRes, MonitorEvent } from '@/types/api'
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
