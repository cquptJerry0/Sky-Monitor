/**
 * Session Replay 相关 API
 */

import { client } from '../client'
import type { ReplayData, RelatedError, ReplayDetail } from '@/types'

export const replaysAPI = {
    /**
     * 根据 replayId 获取 Replay 数据
     */
    getReplayById: (replayId: string, appId: string) =>
        client.get<ReplayData>(`/replays/${replayId}`, {
            params: { appId },
        }),

    /**
     * 根据 replayId 获取关联的所有错误
     *
     * 后端返回的 timestamp 已经是 Unix 毫秒时间戳 (number)
     */
    getRelatedErrors: async (replayId: string, appId: string): Promise<RelatedError[]> => {
        const response = await client.get<any[]>(`/replays/${replayId}/errors`, {
            params: { appId },
        })

        return response.map(error => ({
            id: error.id,
            message: error.message,
            timestamp: String(error.timestamp), // 转换为字符串以匹配类型定义
            errorType: error.eventType as RelatedError['errorType'],
            path: error.pageUrl,
            lineno: error.lineno,
            colno: error.colno,
        }))
    },

    /**
     * 获取 Replay 详情(包含关联错误)
     */
    getReplayDetail: async (replayId: string, appId: string): Promise<ReplayDetail> => {
        const [replayData, relatedErrors] = await Promise.all([
            replaysAPI.getReplayById(replayId, appId),
            replaysAPI.getRelatedErrors(replayId, appId),
        ])

        return {
            ...replayData,
            relatedErrors,
        }
    },

    /**
     * 获取应用的最近 Replay 列表
     */
    listReplays: (params: { appId: string; limit?: number; offset?: number }) =>
        client.get<{ data: ReplayData[]; total: number }>('/replays', { params }),
}
