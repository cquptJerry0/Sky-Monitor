import { Integration, MonitoringEvent } from '../types'

/**
 * 采样配置接口
 * 支持为每种事件类型单独配置采样率
 */
export interface SamplingConfig {
    // 错误类事件
    errorSampleRate?: number // 错误事件采样率，推荐 1.0 (100%)
    exceptionSampleRate?: number // 异常事件采样率，推荐 1.0 (100%)
    unhandledrejectionSampleRate?: number // 未处理的 Promise 拒绝，推荐 1.0 (100%)

    // 性能类事件
    performanceSampleRate?: number // 性能事件采样率，推荐 0.3 (30%)
    webVitalSampleRate?: number // Web Vitals 采样率，推荐 0.5 (50%)

    // 用户行为类事件
    breadcrumbSampleRate?: number // 面包屑采样率，推荐 0.1 (10%)
    messageSampleRate?: number // 消息事件采样率，推荐 1.0 (100%)
    transactionSampleRate?: number // 事务事件采样率，推荐 0.3 (30%)
    customSampleRate?: number // 自定义事件采样率，推荐 0.5 (50%)

    // 默认采样率（用于未配置的事件类型）
    defaultSampleRate?: number // 默认采样率，推荐 1.0 (100%)
}

/**
 * 采样元数据
 */
export interface SamplingMetadata {
    rate: number
    sampled: boolean
    timestamp: number
}

/**
 * 分层采样集成
 * 支持按事件类型设置不同的采样率
 */
export class SamplingIntegration implements Integration {
    name = 'Sampling'
    private normalizedConfig: Required<SamplingConfig>

    constructor(config: SamplingConfig) {
        // 标准化配置，设置默认值
        this.normalizedConfig = {
            // 错误类事件默认 100%
            errorSampleRate: config.errorSampleRate ?? 1.0,
            exceptionSampleRate: config.exceptionSampleRate ?? config.errorSampleRate ?? 1.0,
            unhandledrejectionSampleRate: config.unhandledrejectionSampleRate ?? config.errorSampleRate ?? 1.0,

            // 性能类事件
            performanceSampleRate: config.performanceSampleRate ?? 0.3,
            webVitalSampleRate: config.webVitalSampleRate ?? config.performanceSampleRate ?? 0.5,

            // 用户行为类事件
            breadcrumbSampleRate: config.breadcrumbSampleRate ?? 0.1,
            messageSampleRate: config.messageSampleRate ?? 1.0,
            transactionSampleRate: config.transactionSampleRate ?? config.performanceSampleRate ?? 0.3,
            customSampleRate: config.customSampleRate ?? 0.5,

            // 默认采样率
            defaultSampleRate: config.defaultSampleRate ?? 1.0,
        }

        // 验证所有采样率范围
        Object.entries(this.normalizedConfig).forEach(([key, value]) => {
            if (value < 0 || value > 1) {
                throw new Error(`${key} must be between 0 and 1, got ${value}`)
            }
        })
    }

    /**
     * 事件发送前处理
     * 根据采样率决定是否保留事件
     */
    beforeSend(event: MonitoringEvent): MonitoringEvent | null {
        const rate = this.getSampleRate(event)

        // 总是记录采样元数据，即使是 100% 采样
        const samplingMetadata: SamplingMetadata = {
            rate,
            sampled: true,
            timestamp: Date.now(),
        }

        // 采样决策
        const random = Math.random()
        if (random >= rate) {
            // 如果被丢弃，也记录元数据（便于统计分析）
            // 但由于事件被丢弃，这个元数据不会到达后端
            samplingMetadata.sampled = false
            return null // 丢弃事件
        }

        // 为保留的事件添加采样元数据
        event._sampling = samplingMetadata

        return event
    }

    /**
     * 根据事件类型获取采样率
     */
    private getSampleRate(event: MonitoringEvent): number {
        const eventType = event.type

        // 根据事件类型返回对应的采样率
        switch (eventType) {
            // 错误类事件
            case 'error':
                return this.normalizedConfig.errorSampleRate
            case 'exception':
                return this.normalizedConfig.exceptionSampleRate
            case 'unhandledrejection':
                return this.normalizedConfig.unhandledrejectionSampleRate

            // 性能类事件
            case 'performance':
                return this.normalizedConfig.performanceSampleRate
            case 'webVital':
                return this.normalizedConfig.webVitalSampleRate

            // 用户行为类事件
            case 'message':
                return this.normalizedConfig.messageSampleRate
            case 'transaction':
                return this.normalizedConfig.transactionSampleRate
            case 'custom':
                return this.normalizedConfig.customSampleRate

            // Session 和 Replay 事件
            case 'session':
                return this.normalizedConfig.defaultSampleRate
            case 'replay':
                return 1.0 // Replay 事件总是上报（已经在 SessionReplay 中控制采样）

            // 未知事件类型使用默认采样率
            default:
                return this.normalizedConfig.defaultSampleRate
        }
    }
}
