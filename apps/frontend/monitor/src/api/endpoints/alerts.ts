/**
 * 告警相关 API
 */

import { client } from '../client'
import type { AlertRule, AlertHistory, AlertRuleType } from '../types'

export const alertsAPI = {
    /**
     * 获取告警规则列表
     */
    getRules: (params?: { appId?: string; type?: AlertRuleType }) => client.get<AlertRule[]>('/alerts/rules', { params }),

    /**
     * 获取告警规则详情
     */
    getRule: (id: string) => client.get<AlertRule>(`/alerts/rules/${id}`),

    /**
     * 创建告警规则
     */
    createRule: (data: {
        app_id: string
        name: string
        type: AlertRuleType
        threshold: number
        window: string
        enabled?: boolean
        notification_channels?: string[]
    }) => client.post<AlertRule>('/alerts/rules', data),

    /**
     * 更新告警规则
     */
    updateRule: (
        id: string,
        data: {
            name?: string
            threshold?: number
            window?: string
            enabled?: boolean
            notification_channels?: string[]
        }
    ) => client.put<AlertRule>(`/alerts/rules/${id}`, data),

    /**
     * 删除告警规则
     */
    deleteRule: (id: string) => client.delete(`/alerts/rules/${id}`),

    /**
     * 获取告警历史
     */
    getHistory: (params?: { appId?: string; ruleId?: string; limit?: number }) => client.get<AlertHistory[]>('/alerts/history', { params }),
}
