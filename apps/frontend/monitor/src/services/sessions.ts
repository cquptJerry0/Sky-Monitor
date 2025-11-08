import {
    FetchSessionsParams,
    SessionDetail,
    SessionDetailRes,
    SessionEvent,
    SessionsListRes,
    SessionStats,
    SessionStatsRes,
} from '@/types/api'
import { request } from '@/utils/request'

export const fetchSessions = async (params?: FetchSessionsParams): Promise<SessionsListRes> => {
    return await request.get('/events', {
        params: {
            ...params,
            eventType: 'session',
        },
    })
}

export const fetchSessionDetail = async (sessionId: string): Promise<SessionDetailRes> => {
    return await request.get(`/sessions/${sessionId}`)
}

export const fetchSessionStats = async (params: { appId: string; timeWindow?: 'hour' | 'day' | 'week' }): Promise<SessionStatsRes> => {
    return await request.get('/sessions/stats', { params })
}

export const fetchSessionTrends = async (params: {
    appId: string
    window?: 'hour' | 'day' | 'week'
    limit?: number
}): Promise<{
    success: boolean
    data: Array<{
        time_bucket: string
        session_count: number
        avg_duration: number
        active_sessions: number
    }>
}> => {
    return await request.get('/sessions/trends', { params })
}
