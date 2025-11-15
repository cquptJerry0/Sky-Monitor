/**
 * 事件相关 API
 */

import { client } from '../client'
import type { Event, EventStats, Session, SourceMapStatusInfo } from '../types'

export const eventsAPI = {
    /**
     * 获取事件列表
     * 后端返回: { success: true, data: { data: Event[], total: number } }
     * 响应拦截器解包后: { data: Event[], total: number }
     */
    list: (params: { appId?: string; eventType?: string; limit?: number; offset?: number; timeRange?: string }) =>
        client.get<{ data: Event[]; total: number }>('/events', { params }),

    /**
     * 获取事件详情
     * 后端返回: { success: true, data: Event }
     * 响应拦截器解包后: Event
     */
    getById: (id: string) => client.get<Event>(`/events/${id}`),

    /**
     * 获取统计数据
     * 后端返回: { success: true, data: EventStats }
     * 响应拦截器解包后: EventStats
     */
    getStats: (params: { appId?: string; startTime?: string; endTime?: string }) =>
        client.get<EventStats>('/events/stats/summary', { params }),

    /**
     * 获取应用摘要
     * 后端返回: { success: true, data: EventStats }
     * 响应拦截器解包后: EventStats
     */
    getAppSummary: (appId: string) => client.get<EventStats>(`/events/app/${appId}/summary`),

    /**
     * 获取会话列表
     * 后端返回: { success: true, data: { data: Session[], total: number } }
     * 响应拦截器解包后: { data: Session[], total: number }
     */
    getSessions: (params: { appId: string; limit?: number; offset?: number }) =>
        client.get<{ data: Session[]; total: number }>('/events/sessions/list', { params }),

    /**
     * 获取会话详情（按会话 ID 查询事件）
     * 后端返回: { success: true, data: { data: Event[] } }
     * 响应拦截器解包后: { data: Event[] }
     */
    getSessionEvents: (sessionId: string, appId: string) =>
        client.get<{ data: Event[] }>(`/events/sessions/${sessionId}`, {
            params: { appId },
        }),

    /**
     * 获取慢请求列表
     * 后端返回: { success: true, data: Event[] }
     * 响应拦截器解包后: Event[]
     */
    getSlowRequests: (params: { appId: string; threshold?: number; limit?: number }) =>
        client.get<Event[]>('/events/performance/slow-requests', { params }),

    /**
     * 获取错误分组
     * 后端返回: { success: true, data: Event[] }
     * 响应拦截器解包后: Event[]
     */
    getErrorGroups: (params: { appId: string; limit?: number }) => client.get<Event[]>('/events/errors/groups', { params }),

    /**
     * 按用户查询事件
     * 后端返回: { success: true, data: { data: Event[] } }
     * 响应拦截器解包后: { data: Event[] }
     */
    getUserEvents: (
        userId: string,
        params: {
            appId: string
            limit?: number
        }
    ) => client.get<{ data: Event[] }>(`/events/users/${userId}`, { params }),

    /**
     * 批量查询 SourceMap 解析状态
     * 后端返回: { success: true, data: Record<string, SourceMapStatusInfo> }
     * 响应拦截器解包后: Record<string, SourceMapStatusInfo>
     */
    getSourceMapStatuses: (eventIds: string[]) =>
        client.get<Record<string, SourceMapStatusInfo>>('/events/sourcemap/status', {
            params: { eventIds: eventIds.join(',') },
        }),

    /**
     * 获取采样率统计
     * 后端返回: { success: true, data: { sampled: number, total: number, rate: number } }
     * 响应拦截器解包后: { sampled: number, total: number, rate: number }
     */
    getSamplingStats: (appId: string) =>
        client.get<{ sampled: number; total: number; rate: number }>('/events/stats/sampling', { params: { appId } }),
}
