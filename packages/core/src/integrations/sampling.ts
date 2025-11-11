import { Integration, MonitoringEvent } from '../types'

/**
 * 采样配置接口
 */
export interface SamplingConfig {
    errorSampleRate: number // 错误采样率 0-1，推荐1.0
    performanceSampleRate: number // 性能采样率 0-1，推荐0.3
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

    constructor(private config: SamplingConfig) {
        this.validateConfig()
    }

    /**
     * 验证配置有效性
     */
    private validateConfig(): void {
        if (this.config.errorSampleRate < 0 || this.config.errorSampleRate > 1) {
            throw new Error('errorSampleRate must be between 0 and 1')
        }
        if (this.config.performanceSampleRate < 0 || this.config.performanceSampleRate > 1) {
            throw new Error('performanceSampleRate must be between 0 and 1')
        }
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
        // 错误类事件使用错误采样率
        if (event.type === 'error') {
            return this.config.errorSampleRate
        }

        // 性能类事件使用性能采样率
        if (event.type === 'webVital' || event.type === 'performance') {
            return this.config.performanceSampleRate
        }

        // 其他事件默认使用性能采样率
        return this.config.performanceSampleRate
    }
}
