/**
 * 分层传输管理器
 * 根据数据类型和重要性使用不同的批量策略
 */

import { BaseTransport, Transport } from '@sky-monitor/monitor-sdk-core'
import { BatchedTransport } from './batched'
import { HttpTransport } from './http-transport'
import { SessionReplayTransport } from './session-replay-transport'

/**
 * 事件层级定义
 */
export enum EventLayer {
    CRITICAL = 'critical', // 关键数据，立即上报
    LARGE = 'large', // 大数据，单独通道
    NORMAL = 'normal', // 常规数据，标准批量
    AUXILIARY = 'auxiliary', // 辅助数据，延迟批量
}

/**
 * 层级配置
 */
export interface LayerConfig {
    batchSize: number
    flushInterval: number
    endpoint?: string // 可选的专用端点
    compress?: boolean
}

/**
 * 分层传输配置
 */
export interface LayeredTransportConfig {
    baseEndpoint: string
    layers?: {
        [EventLayer.CRITICAL]?: LayerConfig
        [EventLayer.LARGE]?: LayerConfig
        [EventLayer.NORMAL]?: LayerConfig
        [EventLayer.AUXILIARY]?: LayerConfig
    }
    // 事件类型到层级的映射
    eventTypeMapping?: Record<string, EventLayer>
}

/**
 * 默认层级配置
 */
const DEFAULT_LAYER_CONFIGS: Record<EventLayer, LayerConfig> = {
    [EventLayer.CRITICAL]: {
        batchSize: 1, // 立即发送
        flushInterval: 0, // 无延迟
        compress: false,
    },
    [EventLayer.LARGE]: {
        batchSize: 1, // 单独发送
        flushInterval: 10000, // 10秒
        compress: true, // 压缩
    },
    [EventLayer.NORMAL]: {
        batchSize: 20, // 标准批量
        flushInterval: 5000, // 5秒
        compress: false,
    },
    [EventLayer.AUXILIARY]: {
        batchSize: 50, // 大批量
        flushInterval: 30000, // 30秒
        compress: false,
    },
}

/**
 * 默认事件类型映射
 */
const DEFAULT_EVENT_TYPE_MAPPING: Record<string, EventLayer> = {
    // Critical - 立即上报
    error: EventLayer.CRITICAL,
    exception: EventLayer.CRITICAL,
    unhandledrejection: EventLayer.CRITICAL,
    crash: EventLayer.CRITICAL,

    // Large - 单独通道
    sessionReplay: EventLayer.LARGE,
    screenshot: EventLayer.LARGE,
    profiling: EventLayer.LARGE,

    // Normal - 标准批量
    performance: EventLayer.NORMAL,
    webVital: EventLayer.NORMAL,
    custom: EventLayer.NORMAL,
    resource: EventLayer.NORMAL,
    navigation: EventLayer.NORMAL,
    paint: EventLayer.NORMAL,
    user: EventLayer.NORMAL,

    // Auxiliary - 延迟批量
    breadcrumb: EventLayer.AUXILIARY,
    userContext: EventLayer.AUXILIARY,
    console: EventLayer.AUXILIARY,
    network: EventLayer.AUXILIARY,
}

/**
 * 分层传输管理器
 */
export class LayeredTransportManager extends BaseTransport {
    private transports: Map<EventLayer, Transport> = new Map()
    private eventTypeMapping: Record<string, EventLayer>
    private baseEndpoint: string

    constructor(config: LayeredTransportConfig) {
        super()
        this.baseEndpoint = config.baseEndpoint
        this.eventTypeMapping = {
            ...DEFAULT_EVENT_TYPE_MAPPING,
            ...(config.eventTypeMapping || {}),
        }

        // 初始化各层传输
        this.initializeTransports(config)
    }

    /**
     * 初始化各层传输通道
     */
    private initializeTransports(config: LayeredTransportConfig) {
        const layerConfigs = {
            ...DEFAULT_LAYER_CONFIGS,
            ...(config.layers || {}),
        }

        // Critical Layer - 使用直接传输或最小批量
        this.transports.set(EventLayer.CRITICAL, this.createTransport(EventLayer.CRITICAL, layerConfigs[EventLayer.CRITICAL]))

        // Large Layer - 使用专用 SessionReplay 传输
        const largeConfig = layerConfigs[EventLayer.LARGE]
        this.transports.set(
            EventLayer.LARGE,
            new SessionReplayTransport({
                endpoint: largeConfig.endpoint || `${this.baseEndpoint}/session-replay`,
                flushInterval: largeConfig.flushInterval,
                compress: largeConfig.compress,
                immediateOnError: true,
            })
        )

        // Normal Layer - 标准批量传输
        this.transports.set(EventLayer.NORMAL, this.createTransport(EventLayer.NORMAL, layerConfigs[EventLayer.NORMAL]))

        // Auxiliary Layer - 延迟批量传输
        this.transports.set(EventLayer.AUXILIARY, this.createTransport(EventLayer.AUXILIARY, layerConfigs[EventLayer.AUXILIARY]))
    }

    /**
     * 创建传输实例
     */
    private createTransport(layer: EventLayer, config: LayerConfig): Transport {
        const endpoint = config.endpoint || this.getEndpointForLayer(layer)

        // 创建基础 HTTP 传输
        const httpTransport = new HttpTransport({
            url: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(config.compress && { 'Content-Encoding': 'gzip' }),
            },
        })

        // 如果需要批量，包装成批量传输
        if (config.batchSize > 1) {
            return new BatchedTransport(
                httpTransport,
                {
                    batchSize: config.batchSize,
                    flushInterval: config.flushInterval,
                },
                {
                    onSuccess: () => this.triggerSuccess(),
                    onError: error => this.triggerError(error),
                }
            )
        }

        return httpTransport
    }

    /**
     * 获取层级对应的端点
     */
    private getEndpointForLayer(layer: EventLayer): string {
        switch (layer) {
            case EventLayer.CRITICAL:
                return `${this.baseEndpoint}/critical`
            case EventLayer.LARGE:
                return `${this.baseEndpoint}/large`
            case EventLayer.NORMAL:
                return this.baseEndpoint // 使用默认端点
            case EventLayer.AUXILIARY:
                return `${this.baseEndpoint}/auxiliary`
            default:
                return this.baseEndpoint
        }
    }

    /**
     * 发送事件
     */
    async send(data: Record<string, unknown>): Promise<void> {
        // 获取事件类型
        const eventType = this.getEventType(data)

        // 确定事件层级
        const layer = this.eventTypeMapping[eventType] || EventLayer.NORMAL

        // 选择对应的传输通道
        const transport = this.transports.get(layer)

        if (!transport) {
            console.warn(`[LayeredTransport] No transport for layer: ${layer}`)
            return
        }

        // 添加层级元数据
        const enrichedData = {
            ...data,
            _layer: layer,
            _timestamp: Date.now(),
        }

        // 发送事件
        try {
            await transport.send(enrichedData)
            this.logTransport(eventType, layer)
        } catch (error) {
            console.error(`[LayeredTransport] Failed to send ${eventType} via ${layer}:`, error)
            throw error
        }
    }

    /**
     * 提取事件类型
     */
    private getEventType(data: Record<string, unknown>): string {
        // 优先使用 type 字段
        if (data.type && typeof data.type === 'string') {
            return data.type
        }

        // 检查特殊类型
        if (data.events && Array.isArray(data.events)) {
            // 批量事件，检查第一个事件的类型
            const firstEvent = data.events[0]
            if (firstEvent && typeof firstEvent === 'object' && 'type' in firstEvent) {
                return firstEvent.type as string
            }
        }

        // 检查 category（用于 Session Replay）
        if (data.category === 'sessionReplay') {
            return 'sessionReplay'
        }

        // 默认为 normal
        return 'custom'
    }

    /**
     * 记录传输日志
     */
    private logTransport(eventType: string, layer: EventLayer) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[LayeredTransport] ${eventType} → ${layer}`)
        }
    }

    /**
     * 刷新所有传输通道
     */
    async flush(): Promise<void> {
        const flushPromises = Array.from(this.transports.values()).map(transport => {
            if ('flush' in transport && typeof transport.flush === 'function') {
                return transport.flush()
            }
            return Promise.resolve()
        })

        await Promise.all(flushPromises)
    }

    /**
     * 关闭所有传输通道
     */
    async close(): Promise<void> {
        const closePromises = Array.from(this.transports.values()).map(transport => {
            if ('close' in transport && typeof transport.close === 'function') {
                return transport.close()
            }
            return Promise.resolve()
        })

        await Promise.all(closePromises)
    }

    /**
     * 获取层级统计信息
     */
    getStats(): Record<EventLayer, { sent: number; pending: number }> {
        const stats: Record<string, { sent: number; pending: number }> = {}

        this.transports.forEach((transport, layer) => {
            // 这里可以扩展传输层接口来提供统计信息
            stats[layer] = {
                sent: 0, // TODO: 从 transport 获取
                pending: 0, // TODO: 从 transport 获取
            }
        })

        return stats as Record<EventLayer, { sent: number; pending: number }>
    }
}

/**
 * 创建分层传输的便捷函数
 */
export function createLayeredTransport(config: LayeredTransportConfig): LayeredTransportManager {
    return new LayeredTransportManager(config)
}
