import { EventPipeline } from './pipeline'
import { Transport } from './transport'
import { Integration, MonitoringEvent } from './types'

// 全局客户端实例
let currentClient: Monitoring | null = null

/**
 * 获取当前客户端实例
 */
export function getCurrentClient(): Monitoring | null {
    return currentClient
}

/**
 * 设置当前客户端实例
 */
export function setCurrentClient(client: Monitoring | null): void {
    currentClient = client
}

export class Monitoring {
    private pipeline = new EventPipeline()
    private integrations: Integration[] = []
    private transport: Transport | null = null
    private setupOnceCalled = false

    /**
     * 添加集成
     */
    addIntegration(integration: Integration): this {
        this.integrations.push(integration)
        return this
    }

    /**
     * 初始化监控系统
     */
    init(transport: Transport): void {
        this.transport = transport

        // 设置为当前客户端
        setCurrentClient(this)

        // Step 1: 执行所有setupOnce（仅一次）
        if (!this.setupOnceCalled) {
            this.integrations.forEach(int => int.setupOnce?.())
            this.setupOnceCalled = true
        }

        // Step 2: 执行所有init
        this.integrations.forEach(int => int.init?.(transport))

        // Step 3: 注册所有beforeSend到管道
        this.integrations.forEach(int => {
            if (int.beforeSend) {
                this.pipeline.use(event => int.beforeSend!(event))
            }
        })
    }

    /**
     * 捕获事件（通过管道处理）
     */
    async captureEvent(event: MonitoringEvent): Promise<void> {
        const processed = await this.pipeline.execute(event)
        if (processed && this.transport) {
            this.transport.send(processed)
        }
    }

    /**
     * 兼容旧API - 报告消息
     */
    reportMessage(message: string): void {
        this.captureEvent({ type: 'message', message })
    }

    /**
     * 兼容旧API - 报告事件
     */
    reportEvent(event: unknown): void {
        this.captureEvent({ type: 'event', event })
    }

    /**
     * 刷新传输缓冲区
     * 如果transport支持flush，则立即发送所有缓存的事件
     */
    flush(): void {
        this.transport?.flush?.()
    }

    /**
     * 关闭并清理资源
     */
    close(): void {
        this.flush()
        this.transport = null
        setCurrentClient(null)
    }
}
