/**
 * 事件相关 API
 */

import { client } from '../client'
import type { Event, EventStats, Session, SourceMapStatusInfo } from '../types'

export const eventsAPI = {
    /**
     * 获取事件列表
     */
    list: (params: { appId?: string; eventType?: string; limit?: number; offset?: number; startTime?: string; endTime?: string }) =>
        client.get<{ data: Event[]; total: number }>('/events', { params }),

    /**
     * 获取事件详情
     */
    getById: (id: string) => client.get<Event>(`/events/${id}`),

    /**
     * 获取统计数据
     */
    getStats: (params: { appId?: string; startTime?: string; endTime?: string }) =>
        client.get<EventStats>('/events/stats/summary', { params }),

    /**
     * 获取应用摘要
     */
    getAppSummary: (appId: string) => client.get(`/events/app/${appId}/summary`),

    /**
     * 获取会话列表
     */
    getSessions: (params: { appId: string; limit?: number; offset?: number }) =>
        client.get<{ data: Session[]; total: number }>('/events/sessions/list', { params }),

    /**
     * 获取会话详情（按会话 ID 查询事件）
     */
    getSessionEvents: (sessionId: string, appId: string) =>
        client.get<{ data: Event[] }>(`/events/sessions/${sessionId}`, {
            params: { appId },
        }),

    /**
     * 获取慢请求列表
     */
    getSlowRequests: (params: { appId: string; threshold?: number; limit?: number }) =>
        client.get('/events/performance/slow-requests', { params }),

    /**
     * 获取错误分组
     */
    getErrorGroups: (params: { appId: string; limit?: number }) => client.get('/events/errors/groups', { params }),

    /**
     * 按用户查询事件
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
     */
    getSourceMapStatuses: (eventIds: string[]) =>
        client.get<Record<string, SourceMapStatusInfo>>('/events/sourcemap/status', {
            params: { eventIds: eventIds.join(',') },
        }),

    /**
     * 获取采样率统计
     */
    getSamplingStats: (appId: string) => client.get('/events/stats/sampling', { params: { appId } }),
}
