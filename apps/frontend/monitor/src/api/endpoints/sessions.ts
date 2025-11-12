/**
 * 会话相关 API
 */

import { client } from '../client'
import type { SessionStats, SessionReplayData } from '../types'

export const sessionsAPI = {
    /**
     * 获取会话统计数据
     * 后端返回: { success: true, data: SessionStats }
     * 响应拦截器解包后: SessionStats
     */
    getStats: (params: { appId: string; timeWindow?: 'hour' | 'day' | 'week' }) =>
        client.get<SessionStats>('/events/sessions/stats', { params }),

    /**
     * 获取会话回放数据
     * 后端返回: { success: true, data: SessionReplayData }
     * 响应拦截器解包后: SessionReplayData
     */
    getReplay: (sessionId: string, appId: string) =>
        client.get<SessionReplayData>(`/events/sessions/${sessionId}/replay`, {
            params: { appId },
        }),
}
