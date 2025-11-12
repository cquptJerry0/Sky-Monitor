/**
 * 错误分析相关 API
 */

import { client } from '../client'
import type { ErrorTrend, SmartErrorGroup, Spike } from '../types'

export const errorsAPI = {
    /**
     * 获取错误趋势
     */
    getTrends: (params: { appId: string; fingerprint?: string; window: 'hour' | 'day' | 'week'; limit?: number }) =>
        client.get<ErrorTrend[]>('/error-analytics/trends', { params }),

    /**
     * 对比多个错误的趋势
     */
    compareTrends: (params: { appId: string; fingerprints: string[]; window: 'hour' | 'day' | 'week'; limit?: number }) =>
        client.get<Record<string, ErrorTrend[]>>('/error-analytics/trends/compare', {
            params: {
                ...params,
                fingerprints: params.fingerprints.join(','),
            },
        }),

    /**
     * 获取智能错误分组
     */
    getSmartGroups: (params: { appId: string; threshold?: number; limit?: number }) =>
        client.get<SmartErrorGroup[]>('/error-analytics/smart-groups', { params }),

    /**
     * 检测错误突增
     */
    detectSpikes: (params: { appId: string; window?: 'hour' | 'day'; lookback?: number }) =>
        client.get('/error-analytics/spike-detection', { params }),

    /**
     * 获取最近的错误突增告警
     */
    getRecentSpikes: (params: { appId: string; limit?: number }) => client.get<Spike[]>('/error-analytics/recent-spikes', { params }),
}
