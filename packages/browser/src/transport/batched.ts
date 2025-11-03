import { Transport } from '@sky-monitor/monitor-sdk-core'

/**
 * 批量传输配置
 */
export interface BatchedTransportOptions {
    batchSize?: number // 批次大小，默认20
    flushInterval?: number // 刷新间隔(ms)，默认5000
}

/**
 * 批量传输
 * 将多个事件合并成一个请求发送，减少网络请求数
 */
export class BatchedTransport implements Transport {
    private queue: Array<Record<string, unknown>> = []
    private timer: number | null = null
    private readonly batchSize: number
    private readonly flushInterval: number

    constructor(
        private innerTransport: Transport,
        options: BatchedTransportOptions = {}
    ) {
        this.batchSize = options.batchSize ?? 20
        this.flushInterval = options.flushInterval ?? 5000

        this.setupUnloadHandler()
    }

    /**
     * 发送数据（加入队列）
     */
    send(data: Record<string, unknown>): void {
        this.queue.push(data)

        // 大小触发：队列达到批次大小
        if (this.queue.length >= this.batchSize) {
            this.flush()
        }
        // 时间触发：启动定时器
        else if (this.timer === null) {
            this.timer = window.setTimeout(() => this.flush(), this.flushInterval) as unknown as number
        }
    }

    /**
     * 刷新队列（发送批量事件）
     */
    flush(): void {
        if (this.queue.length === 0) return

        this.innerTransport.send({
            type: 'batch',
            events: this.queue,
            count: this.queue.length,
            timestamp: new Date().toISOString(),
        })

        this.queue = []

        if (this.timer !== null) {
            clearTimeout(this.timer)
            this.timer = null
        }
    }

    /**
     * 页面卸载前发送剩余事件
     */
    private setupUnloadHandler(): void {
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('beforeunload', () => {
                this.flush()
            })
        }
    }
}
