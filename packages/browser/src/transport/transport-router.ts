/**
 * Transport Router
 * 简化的传输路由器，替代 LayeredTransportManager
 *
 * 设计原则（基于 Sentry 标准）：
 * 1. 只有三个路由：immediate（立即）、batched（批量）、replay（录像）
 * 2. 根据事件类型简单路由，不需要复杂的层级映射
 * 3. 压缩在 Transport 层自动处理，不需要单独通道
 */

import { BaseTransport, Transport } from '@sky-monitor/monitor-sdk-core'
import { BatchedTransport } from './batched'
import { BrowserTransport } from './index'
import { SessionReplayTransport } from './session-replay-transport'

/**
 * TransportRouter 配置
 */
export interface TransportRouterConfig {
    baseEndpoint: string
    // Immediate 配置（错误立即上报）
    immediate?: {
        endpoint?: string // 默认: /critical
    }
    // Batched 配置（批量上报）
    batched?: {
        endpoint?: string // 默认: /batch
        batchSize?: number // 默认: 20
        flushInterval?: number // 默认: 5000ms
        autoCompress?: boolean // 默认: true（超过 10KB 自动压缩）
    }
    // Replay 配置（Session Replay）
    replay?: {
        endpoint?: string // 默认: /replay
        compress?: boolean // 默认: true
        immediateOnError?: boolean // 默认: true
    }
}

/**
 * TransportRouter
 * 根据事件类型路由到不同的 Transport
 */
export class TransportRouter extends BaseTransport {
    private immediateTransport: Transport
    private batchedTransport: Transport
    private replayTransport: Transport

    constructor(config: TransportRouterConfig) {
        super()

        const baseEndpoint = config.baseEndpoint

        // 1. Immediate Transport - 错误立即上报
        const immediateEndpoint = config.immediate?.endpoint || `${baseEndpoint}/critical`
        this.immediateTransport = new BrowserTransport(immediateEndpoint)

        // 2. Batched Transport - 批量上报
        const batchedEndpoint = config.batched?.endpoint || `${baseEndpoint}/batch`
        const batchedInnerTransport = new BrowserTransport(batchedEndpoint)
        this.batchedTransport = new BatchedTransport(batchedInnerTransport, {
            batchSize: config.batched?.batchSize ?? 20,
            flushInterval: config.batched?.flushInterval ?? 5000,
        })

        // 3. Replay Transport - Session Replay
        const replayEndpoint = config.replay?.endpoint || `${baseEndpoint}/replay`
        this.replayTransport = new SessionReplayTransport({
            endpoint: replayEndpoint,
            compress: config.replay?.compress ?? true,
            immediateOnError: config.replay?.immediateOnError ?? true,
        })
    }

    /**
     * 发送事件（根据类型路由）
     */
    async send(data: Record<string, unknown>): Promise<void> {
        const eventType = this.getEventType(data)

        // 路由逻辑
        switch (eventType) {
            case 'error':
            case 'exception':
            case 'unhandledrejection':
                // 错误类事件 - 立即上报
                await this.immediateTransport.send(data)
                break

            case 'replay':
                // Session Replay - 专用通道
                await this.replayTransport.send(data)
                break

            case 'transaction':
            case 'performance':
            case 'webVital':
            case 'message':
            case 'session':
            case 'custom':
            default:
                // 其他事件 - 批量上报
                await this.batchedTransport.send(data)
                break
        }
    }

    /**
     * 获取事件类型
     */
    private getEventType(data: Record<string, unknown>): string {
        return (data.type as string) || 'unknown'
    }

    /**
     * 手动刷新批量队列
     */
    async flush(): Promise<void> {
        if ('flush' in this.batchedTransport && typeof this.batchedTransport.flush === 'function') {
            await this.batchedTransport.flush()
        }
        if ('flush' in this.replayTransport && typeof this.replayTransport.flush === 'function') {
            await this.replayTransport.flush()
        }
    }

    /**
     * 关闭并清理资源
     */
    async close(): Promise<void> {
        await Promise.all([this.immediateTransport.close?.(), this.batchedTransport.close?.(), this.replayTransport.close?.()])
    }
}
