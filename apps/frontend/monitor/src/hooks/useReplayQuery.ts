/**
 * Replay 查询相关 Hook
 *
 * ## 数据流说明
 * 1. **SDK 层**: 用户会话中发生错误时，SessionReplay Integration 自动录制前后 10 秒的用户操作
 * 2. **DSN Server 层**: 接收 rrweb 事件数组，存储到 ClickHouse
 * 3. **Monitor Backend 层**: 提供 Replay 查询 API，返回 rrweb 事件和关联错误
 * 4. **Monitor Frontend 层**: 使用这些 hooks 获取数据，传递给 RRWebPlayer 组件播放
 *
 * ## Replay 数据结构
 * - replayId: 唯一标识符，同一个 replayId 可能关联多个错误
 * - events: rrweb 事件数组，包含 DOM 快照和用户交互记录
 * - metadata: 元数据 (事件数量、时长、压缩信息)
 * - trigger: 触发方式 (error: 错误触发, manual: 手动触发, sampled: 采样触发)
 *
 * ## 缓存策略
 * - 使用 TanStack Query 管理缓存
 * - staleTime: 数据在此时间内被视为新鲜，不会重新请求
 * - queryKey: 用于缓存标识和自动失效
 */

import { useQuery } from '@tanstack/react-query'
import { replaysAPI } from '@/api'
import { QUERY_CONFIG } from '@/utils/constants'

/**
 * 查询单个 Replay 数据
 *
 * ## 使用场景
 * - 查看单个 Replay 的详细信息
 * - 获取 rrweb 事件数组用于播放
 *
 * ## 返回数据
 * - replayId: Replay 唯一标识
 * - events: rrweb 事件数组 (EventWithTime[])
 * - metadata: 元数据 (事件数量、时长、压缩信息)
 * - trigger: 触发方式
 * - timestamp: 创建时间
 *
 * @param replayId - Replay ID
 * @param appId - 应用 ID
 * @returns TanStack Query 结果对象
 */
export function useReplay(replayId: string | null, appId: string | null) {
    return useQuery({
        queryKey: ['replay', replayId, appId],
        queryFn: () => replaysAPI.getReplayById(replayId!, appId!),
        enabled: !!replayId && !!appId, // 只有当 replayId 和 appId 都存在时才执行查询
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 查询 Replay 关联的所有错误
 *
 * ## 使用场景
 * - 显示 Replay 中发生的所有错误列表
 * - 支持点击错误跳转到对应时间点
 *
 * ## 为什么需要单独查询错误?
 * - 错误数据可能很大，按需加载
 * - 支持独立刷新错误列表
 * - 可以在不重新加载 Replay 的情况下更新错误状态
 *
 * ## 返回数据
 * - RelatedError[]: 错误列表
 *   - id: 错误事件 ID
 *   - message: 错误消息
 *   - timestamp: 错误发生时间
 *   - errorType: 错误类型 (error/httpError/resourceError/unhandledrejection)
 *   - path/lineno/colno: 错误位置信息
 *
 * @param replayId - Replay ID
 * @param appId - 应用 ID
 * @returns TanStack Query 结果对象
 */
export function useRelatedErrors(replayId: string | null, appId: string | null) {
    return useQuery({
        queryKey: ['relatedErrors', replayId, appId],
        queryFn: () => replaysAPI.getRelatedErrors(replayId!, appId!),
        enabled: !!replayId && !!appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 查询 Replay 详情 (包含关联错误)
 *
 * ## 使用场景
 * - 一次性获取 Replay 数据和关联错误
 * - 适用于 Replay 详情页
 *
 * ## 实现方式
 * - 并行请求 Replay 数据和关联错误
 * - 使用 Promise.all 合并结果
 * - 减少请求次数，提升加载速度
 *
 * ## 返回数据
 * - ReplayDetail: 包含 ReplayData 和 relatedErrors
 *
 * @param replayId - Replay ID
 * @param appId - 应用 ID
 * @returns TanStack Query 结果对象
 */
export function useReplayDetail(replayId: string | null, appId: string | null) {
    return useQuery({
        queryKey: ['replayDetail', replayId, appId],
        queryFn: () => replaysAPI.getReplayDetail(replayId!, appId!),
        enabled: !!replayId && !!appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}

/**
 * 查询 Replay 列表
 *
 * ## 使用场景
 * - 显示应用的最近 Replay 列表
 * - 支持分页加载
 *
 * ## 返回数据
 * - data: ReplayData[] - Replay 列表
 * - total: number - 总数量
 *
 * @param params - 查询参数
 *   - appId: 应用 ID (必填)
 *   - limit: 每页数量 (可选)
 *   - offset: 偏移量 (可选)
 * @returns TanStack Query 结果对象
 */
export function useReplays(params: Parameters<typeof replaysAPI.listReplays>[0]) {
    return useQuery({
        queryKey: ['replays', params],
        queryFn: () => replaysAPI.listReplays(params),
        enabled: !!params.appId,
        staleTime: QUERY_CONFIG.STALE_TIME,
    })
}
