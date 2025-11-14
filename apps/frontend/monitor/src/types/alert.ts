/**
 * 告警相关类型定义
 */

import type { AlertRuleType } from './api'

// ==================== 告警相关类型 ====================

/**
 * 告警规则
 */
export interface AlertRule {
    id: string
    app_id: string
    name: string
    type: AlertRuleType
    threshold: number
    window: string
    enabled: boolean
    notification_channels?: string[]
    created_at?: string
    updated_at?: string
}

/**
 * 告警历史
 */
export interface AlertHistory {
    id: string
    rule_id: string
    rule_name: string
    app_id: string
    triggered_at: string
    threshold: number
    actual_value: number
    severity: 'low' | 'medium' | 'high' | 'critical'
    resolved: boolean
    resolved_at?: string
}
