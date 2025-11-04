import { Transport } from '@sky-monitor/monitor-sdk-core'

/**
 * 离线传输配置
 */
export interface OfflineTransportOptions {
    /**
     * LocalStorage 存储key，默认 'sky-monitor-offline'
     */
    storageKey?: string

    /**
     * 最大缓存事件数，默认50
     */
    maxQueueSize?: number

    /**
     * 重试间隔（毫秒），默认10000ms
     */
    retryInterval?: number
}

interface QueueItem {
    data: Record<string, unknown>
    timestamp: number
    retryCount: number
}

/**
 * 离线传输包装器
 * 网络失败时缓存到 LocalStorage，恢复后自动重试
 */
export class OfflineTransport implements Transport {
    private readonly storageKey: string
    private readonly maxQueueSize: number
    private readonly retryInterval: number
    private retryTimer: number | null = null
    private isSending = false

    constructor(
        private innerTransport: Transport,
        options: OfflineTransportOptions = {}
    ) {
        this.storageKey = options.storageKey ?? 'sky-monitor-offline'
        this.maxQueueSize = options.maxQueueSize ?? 50
        this.retryInterval = options.retryInterval ?? 10000

        this.setupNetworkListener()
        this.startRetryTimer()

        // 初始化时尝试发送队列中的数据
        this.processQueue()
    }

    /**
     * 发送数据
     */
    send(data: Record<string, unknown>): void {
        if (this.isOnline()) {
            this.trySend(data)
        } else {
            this.saveToStorage(data)
        }
    }

    /**
     * 刷新队列
     */
    flush(): void {
        this.innerTransport.flush?.()
        this.processQueue()
    }

    /**
     * 尝试发送（带错误处理）
     */
    private trySend(data: Record<string, unknown>): void {
        try {
            // 尝试使用内部传输发送
            this.innerTransport.send(data)

            // 如果发送成功，处理队列中的数据
            if (this.getQueue().length > 0) {
                this.processQueue()
            }
        } catch (error) {
            // 发送失败，保存到 LocalStorage
            this.saveToStorage(data)
        }
    }

    /**
     * 保存到 LocalStorage
     */
    private saveToStorage(data: Record<string, unknown>): void {
        try {
            const queue = this.getQueue()

            // 容量检查
            if (queue.length >= this.maxQueueSize) {
                queue.shift() // 删除最旧的
            }

            queue.push({
                data,
                timestamp: Date.now(),
                retryCount: 0,
            })

            localStorage.setItem(this.storageKey, JSON.stringify(queue))
        } catch (error) {
            // LocalStorage 满了或被禁用
            console.warn('Failed to save to LocalStorage:', error)
        }
    }

    /**
     * 获取队列
     */
    private getQueue(): QueueItem[] {
        try {
            const data = localStorage.getItem(this.storageKey)
            return data ? JSON.parse(data) : []
        } catch {
            return []
        }
    }

    /**
     * 处理队列（重试发送）
     */
    private processQueue(): void {
        if (!this.isOnline() || this.isSending) return

        const queue = this.getQueue()
        if (queue.length === 0) return

        this.isSending = true
        const failed: QueueItem[] = []

        // 逐个尝试发送
        for (const item of queue) {
            try {
                this.innerTransport.send(item.data)
                // 发送成功，不加入失败列表
            } catch (error) {
                item.retryCount++
                // 最多重试3次
                if (item.retryCount < 3) {
                    failed.push(item)
                }
            }
        }

        // 更新队列
        try {
            if (failed.length > 0) {
                localStorage.setItem(this.storageKey, JSON.stringify(failed))
            } else {
                localStorage.removeItem(this.storageKey)
            }
        } catch (error) {
            console.warn('Failed to update LocalStorage queue:', error)
        }

        this.isSending = false
    }

    /**
     * 检查网络状态
     */
    private isOnline(): boolean {
        return typeof navigator !== 'undefined' ? navigator.onLine : true
    }

    /**
     * 监听网络状态变化
     */
    private setupNetworkListener(): void {
        if (typeof window === 'undefined') return

        window.addEventListener('online', () => {
            this.processQueue()
        })

        // 页面可见性变化时也尝试发送
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.processQueue()
            }
        })
    }

    /**
     * 启动定时重试
     */
    private startRetryTimer(): void {
        if (typeof window === 'undefined') return

        this.retryTimer = window.setInterval(() => {
            this.processQueue()
        }, this.retryInterval) as unknown as number
    }
}
