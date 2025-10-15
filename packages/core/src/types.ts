import { Transport } from './transport'

/**
 * Integration interface
 * 集成接口
 * 基于插件化设计
 */
export interface IIntegration {
    init(transport: Transport): void
}

export class Integration implements IIntegration {
    constructor(private callback: () => void) {}

    transport: Transport | null = null

    init(transport: Transport) {
        this.transport = transport
    }
}

/**
 * Monitoring options
 * 监控相关配置
 */
export interface MonitoringOptions {
    dsn: string
    integrations: Integration[]
}
