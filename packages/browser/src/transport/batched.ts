import { BaseTransport, Transport, TransportCallbacks, getChinaTimestamp } from '@sky-monitor/monitor-sdk-core'

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
export class BatchedTransport extends BaseTransport {
    private queue: Array<Record<string, unknown>> = []
    private timer: number | null = null
    private readonly batchSize: number
    private readonly flushInterval: number
    private isFlushing: boolean = false

    constructor(
        private innerTransport: Transport,
        options: BatchedTransportOptions = {},
        callbacks?: TransportCallbacks
    ) {
        super(callbacks)
        this.batchSize = options.batchSize ?? 20
        this.flushInterval = options.flushInterval ?? 5000

        this.setupUnloadHandler()
    }

    /**
     * 发送数据（加入队列）
     */
    async send(data: Record<string, unknown>): Promise<void> {
        this.queue.push(data)
        console.log(`[BatchedTransport] Event added to queue. Queue size: ${this.queue.length}/${this.batchSize}`)

        // 大小触发：队列达到批次大小且当前没有在 flush
        if (this.queue.length >= this.batchSize && !this.isFlushing) {
            console.log(`[BatchedTransport] Queue size reached ${this.batchSize}, flushing...`)
            // 不等待 flush 完成，避免阻塞后续事件

            this.flush()
        }
        // 时间触发：启动定时器
        else if (this.timer === null && !this.isFlushing) {
            console.log(`[BatchedTransport] Starting flush timer (${this.flushInterval}ms)`)
            this.timer = window.setTimeout(() => {
                console.log(`[BatchedTransport] Timer triggered, flushing ${this.queue.length} events...`)

                this.flush()
            }, this.flushInterval) as unknown as number
        }
    }

    /**
     * 刷新队列（发送批量事件）
     */
    async flush(): Promise<void> {
        if (this.queue.length === 0) {
            console.log('[BatchedTransport] Flush called but queue is empty')
            return
        }

        if (this.isFlushing) {
            console.log('[BatchedTransport] Already flushing, skipping...')
            return
        }

        this.isFlushing = true

        try {
            // 持续 flush 直到队列为空
            while (this.queue.length > 0) {
                // 取出当前批次的事件（最多 batchSize 个）
                const eventsToSend = this.queue.splice(0, this.batchSize)
                const batchSize = eventsToSend.length

                console.log(`[BatchedTransport] Flushing ${batchSize} events to server... (${this.queue.length} remaining in queue)`)

                try {
                    await this.innerTransport.send({
                        type: 'batch',
                        events: eventsToSend,
                        count: eventsToSend.length,
                        timestamp: getChinaTimestamp(),
                    })

                    console.log(`[BatchedTransport] Successfully flushed ${batchSize} events`)
                    this.triggerSuccess()
                } catch (error) {
                    console.error(`[BatchedTransport] Failed to flush ${batchSize} events:`, error)
                    // 失败时，将事件放回队列头部
                    this.queue = [...eventsToSend, ...this.queue]
                    this.triggerError(error instanceof Error ? error : new Error(String(error)))
                    throw error
                }
            }

            // 所有批次发送完成后，清除定时器
            if (this.timer !== null) {
                clearTimeout(this.timer)
                this.timer = null
            }
        } finally {
            this.isFlushing = false

            // flush 完成后，检查是否有新事件进入队列
            // 如果有，且达到批次大小，则触发新的 flush
            if (this.queue.length >= this.batchSize) {
                console.log(`[BatchedTransport] New events added during flush, triggering another flush...`)

                this.flush()
            }
        }
    }

    /**
     * 关闭并清理资源
     */
    async close(): Promise<void> {
        // 先刷新队列
        await this.flush()

        // 清理定时器
        if (this.timer !== null) {
            clearTimeout(this.timer)
            this.timer = null
        }

        // 关闭内部传输
        if (this.innerTransport.close) {
            await this.innerTransport.close()
        }
    }

    /**
     * 页面卸载前发送剩余事件
     * 使用 sendBeacon 确保数据能够发送（即使页面已卸载）
     */
    private setupUnloadHandler(): void {
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('beforeunload', () => {
                // 使用 sendBeacon 确保数据发送
                if (this.queue.length > 0 && navigator.sendBeacon) {
                    // 获取内部传输的 DSN
                    const dsn = this.getInnerTransportDsn()
                    if (dsn) {
                        const url = `${dsn}/batch`
                        // sendBeacon 发送的是事件数组，与 BrowserTransport 的批量格式一致
                        const blob = new Blob([JSON.stringify(this.queue)], {
                            type: 'application/json',
                        })
                        navigator.sendBeacon(url, blob)
                        this.queue = []
                    }
                } else {
                    // 降级：尝试同步 flush（可能不会完成）

                    this.flush()
                }
            })
        }
    }

    /**
     * 获取内部传输的 DSN
     */
    private getInnerTransportDsn(): string | null {
        // 检查 innerTransport 是否有 dsn 属性
        if ('dsn' in this.innerTransport && typeof (this.innerTransport as any).dsn === 'string') {
            return (this.innerTransport as any).dsn
        }
        return null
    }
}
