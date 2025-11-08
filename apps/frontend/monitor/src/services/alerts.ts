import { request } from '@/utils/request'

export interface Alert {
    id: string
    name: string
    status: 'active' | 'draft' | 'archived'
    type: 'error' | 'performance' | 'custom'
    conditions: {
        metric: string
        operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
        threshold: number
        timeWindow?: number
    }
    actions: {
        type: 'email' | 'webhook' | 'slack'
        config: Record<string, any>
    }[]
    appId: string
    createdAt: string
    updatedAt: string
}

export interface CreateAlertPayload {
    name: string
    type: 'error' | 'performance' | 'custom'
    conditions: Alert['conditions']
    actions: Alert['actions']
    appId: string
}

export interface UpdateAlertPayload extends Partial<CreateAlertPayload> {
    status?: 'active' | 'draft' | 'archived'
}

export interface FetchAlertsParams {
    appId?: string
    status?: 'active' | 'draft' | 'archived'
    type?: 'error' | 'performance' | 'custom'
    limit?: number
    offset?: number
}

export interface AlertsListRes {
    success: boolean
    data: {
        data: Alert[]
        total: number
        limit: number
        offset: number
    }
}

export const fetchAlerts = async (params?: FetchAlertsParams): Promise<AlertsListRes> => {
    return await request.get('/alerts', { params })
}

export const fetchAlertById = async (alertId: string): Promise<{ success: boolean; data: Alert }> => {
    return await request.get(`/alerts/${alertId}`)
}

export const createAlert = async (payload: CreateAlertPayload): Promise<{ success: boolean; data: Alert }> => {
    return await request.post('/alerts', payload)
}

export const updateAlert = async (alertId: string, payload: UpdateAlertPayload): Promise<{ success: boolean; data: Alert }> => {
    return await request.put(`/alerts/${alertId}`, payload)
}

export const deleteAlert = async (alertId: string): Promise<{ success: boolean }> => {
    return await request.delete(`/alerts/${alertId}`)
}

export const triggerAlert = async (alertId: string): Promise<{ success: boolean }> => {
    return await request.post(`/alerts/${alertId}/trigger`)
}

export const fetchAlertHistory = async (params: {
    alertId?: string
    appId?: string
    startTime?: string
    endTime?: string
    limit?: number
}): Promise<{
    success: boolean
    data: Array<{
        id: string
        alertId: string
        triggeredAt: string
        value: number
        status: 'resolved' | 'active'
        message: string
    }>
}> => {
    return await request.get('/alerts/history', { params })
}
