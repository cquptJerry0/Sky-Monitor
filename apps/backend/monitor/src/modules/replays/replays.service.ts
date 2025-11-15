import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClickHouseClient } from '@clickhouse/client'

@Injectable()
export class ReplaysService {
    private readonly logger = new Logger(ReplaysService.name)

    constructor(@Inject('CLICKHOUSE_CLIENT') private clickhouseClient: ClickHouseClient) {}

    /**
     * 根据 replayId 获取 Replay 数据
     *
     * 支持延迟查询:
     * - 如果第一次查询失败,等待 2 秒后重试一次
     * - 这样可以处理 Error 事件先到达,Replay 事件稍后到达的情况
     *
     * 修改: 同时返回关联的错误事件列表
     */
    async getReplayById(replayId: string, appId: string, retryOnce = true) {
        try {
            const query = `
                SELECT
                    id,
                    replay_id as replayId,
                    error_event_id as errorEventId,
                    events,
                    event_count as eventCount,
                    duration,
                    compressed,
                    original_size as originalSize,
                    compressed_size as compressedSize,
                    trigger,
                    toUnixTimestamp(timestamp) * 1000 as timestamp,
                    created_at as createdAt
                FROM session_replays
                WHERE replay_id = {replayId:String}
                  AND app_id = {appId:String}
                LIMIT 1
            `

            const result = await this.clickhouseClient.query({
                query,
                query_params: { replayId, appId },
            })

            const data = (await result.json()) as any

            // 如果没有找到数据且允许重试,等待 2 秒后重试一次
            if ((!data.data || data.data.length === 0) && retryOnce) {
                this.logger.log(`Replay not found: ${replayId}, retrying after 2s...`)
                await new Promise(resolve => setTimeout(resolve, 2000))
                return this.getReplayById(replayId, appId, false) // 递归调用,但不再重试
            }

            if (!data.data || data.data.length === 0) {
                return null
            }

            const row = data.data[0]

            // 解析 events JSON 字符串
            let events = []
            try {
                events = JSON.parse(row.events || '[]')
            } catch (error) {
                this.logger.error(`Failed to parse replay events: ${error.message}`)
            }

            // 验证 rrweb 事件是否以 4→2→3 开头
            const isValidReplay = this.validateReplayEvents(events)
            if (!isValidReplay) {
                this.logger.warn(`Invalid replay events for ${replayId}: missing Meta(4) or FullSnapshot(2)`)
            }

            // 获取关联的错误事件
            const relatedErrors = await this.getRelatedErrors(replayId, appId)

            return {
                replayId: row.replayId,
                errorEventId: row.errorEventId,
                events,
                metadata: {
                    eventCount: row.eventCount,
                    duration: row.duration,
                    compressed: row.compressed === 1,
                    originalSize: row.originalSize,
                    compressedSize: row.compressedSize,
                },
                trigger: row.trigger,
                timestamp: row.timestamp,
                createdAt: row.createdAt,
                relatedErrors, // 新增: 关联的错误事件列表
            }
        } catch (error) {
            this.logger.error(`Failed to get replay by id: ${error.message}`, error.stack)
            throw error
        }
    }

    /**
     * 验证 rrweb 事件是否有效
     *
     * rrweb 回放器需要:
     * - Type 4 (Meta): 页面元数据 (URL, 宽高)
     * - Type 2 (FullSnapshot): 完整的 DOM 快照
     * - Type 3 (IncrementalSnapshot): 增量快照
     *
     * 正常的 replay 应该以 4→2→3 开头
     */
    private validateReplayEvents(events: any[]): boolean {
        if (!events || events.length < 3) {
            return false
        }

        // 检查是否有 Meta 事件 (type: 4)
        const hasMeta = events.some(e => e.type === 4)
        // 检查是否有 FullSnapshot 事件 (type: 2)
        const hasFullSnapshot = events.some(e => e.type === 2)

        return hasMeta && hasFullSnapshot
    }

    /**
     * 根据 replayId 获取关联的所有错误事件
     *
     * 修复:
     * 1. 使用 replay_id 字段而不是 JSONExtractString
     * 2. 将 timestamp 转换为 Unix 毫秒时间戳,与 rrweb 事件时间戳格式一致
     */
    async getRelatedErrors(replayId: string, appId: string) {
        try {
            const query = `
                SELECT
                    id,
                    event_type as eventType,
                    error_message as message,
                    error_stack as stack,
                    toUnixTimestamp(timestamp) * 1000 as timestamp,
                    http_url as httpUrl,
                    http_status as httpStatus,
                    resource_url as resourceUrl,
                    resource_type as resourceType,
                    path as pageUrl,
                    user_id as userId
                FROM monitor_events
                WHERE replay_id = {replayId:String}
                  AND app_id = {appId:String}
                  AND event_type IN ('error', 'exception', 'unhandledrejection')
                ORDER BY timestamp ASC
            `

            const result = await this.clickhouseClient.query({
                query,
                query_params: { replayId, appId },
            })

            const data = (await result.json()) as any

            return data.data || []
        } catch (error) {
            this.logger.error(`Failed to get related errors: ${error.message}`, error.stack)
            throw error
        }
    }
}
