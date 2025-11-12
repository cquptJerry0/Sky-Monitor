/**
 * 错误分析相关 API
 */

import { client } from '../client'
import type { ErrorTrend, SmartErrorGroup, Spike } from '../types'

export const errorsAPI = {
    /**
     * 获取错误趋势
     * 后端返回: { success: true, data: ErrorTrend[] }
     * 响应拦截器解包后: ErrorTrend[]
     */
    getTrends: (params: { appId: string; fingerprint?: string; window: 'hour' | 'day' | 'week'; limit?: number }) =>
        client.get<ErrorTrend[]>('/error-analytics/trends', { params }),

    /**
     * 对比多个错误的趋势
     * 后端返回: { success: true, data: Record<string, ErrorTrend[]> }
     * 响应拦截器解包后: Record<string, ErrorTrend[]>
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
     * 后端返回: { success: true, data: SmartErrorGroup[] }
     * 响应拦截器解包后: SmartErrorGroup[]
     */
    getSmartGroups: (params: { appId: string; threshold?: number; limit?: number }) =>
        client.get<SmartErrorGroup[]>('/error-analytics/smart-groups', { params }),

    /**
     * 检测错误突增
     * 后端返回: { success: true, data: Spike[] }
     * 响应拦截器解包后: Spike[]
     */
    detectSpikes: (params: { appId: string; window?: 'hour' | 'day'; lookback?: number }) =>
        client.get<Spike[]>('/error-analytics/spike-detection', { params }),

    /**
     * 获取最近的错误突增告警
     * 后端返回: { success: true, data: Spike[] }
     * 响应拦截器解包后: Spike[]
     */
    getRecentSpikes: (params: { appId: string; limit?: number }) => client.get<Spike[]>('/error-analytics/recent-spikes', { params }),
}
