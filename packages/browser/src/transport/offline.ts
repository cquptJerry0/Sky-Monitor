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
 *
 * 改进的保存机制：
 * 1. 检测到离线状态时立即保存
 * 2. 发送失败时保存
 * 3. 页面卸载前保存未发送的数据
 * 4. 监听 online/offline 事件
 */
export class OfflineTransport implements Transport {
    private readonly storageKey: string
    private readonly maxQueueSize: number
    private readonly retryInterval: number
    private retryTimer: number | null = null
    private isSending = false
    private pendingQueue: QueueItem[] = [] // 内存中的待发送队列

    constructor(
        private innerTransport: Transport,
        options: OfflineTransportOptions = {}
    ) {
        this.storageKey = options.storageKey ?? 'sky-monitor-offline'
        this.maxQueueSize = options.maxQueueSize ?? 50
        this.retryInterval = options.retryInterval ?? 10000

        this.setupNetworkListener()
        this.setupBeforeUnloadListener()
        this.startRetryTimer()

        // 初始化时尝试发送队列中的数据
        this.processQueue()
    }

    /**
     * 发送数据
     */
    send(data: Record<string, unknown>): void {
        const item: QueueItem = {
            data,
            timestamp: Date.now(),
            retryCount: 0,
        }

        if (this.isOnline()) {
            // 在线状态：先加入内存队列，然后尝试发送
            this.pendingQueue.push(item)
            this.trySend(data)
        } else {
            // 离线状态：直接保存到 LocalStorage
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

            // 发送成功，从内存队列中移除
            this.pendingQueue = this.pendingQueue.filter(item => item.data !== data)

            // 如果 LocalStorage 中有数据，尝试处理
            if (this.getQueue().length > 0) {
                this.processQueue()
            }
        } catch (error) {
            // 发送失败，保存到 LocalStorage
            this.saveToStorage(data)
            // 从内存队列中移除（已保存到 LocalStorage）
            this.pendingQueue = this.pendingQueue.filter(item => item.data !== data)
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
            // LocalStorage 满了或被禁用，静默失败
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

        // 监听网络恢复
        window.addEventListener('online', () => {
            this.processQueue()
        })

        // 监听网络断开
        window.addEventListener('offline', () => {
            // 网络断开时，将内存队列中的数据保存到 LocalStorage
            this.savePendingQueue()
        })

        // 页面可见性变化时也尝试发送
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.processQueue()
            }
        })
    }

    /**
     * 监听页面卸载事件
     * 在页面关闭前保存未发送的数据
     */
    private setupBeforeUnloadListener(): void {
        if (typeof window === 'undefined') return

        window.addEventListener('beforeunload', () => {
            // 保存内存队列中的数据
            this.savePendingQueue()

            // 如果内部传输有 flush 方法，尝试刷新
            if (this.innerTransport.flush) {
                this.innerTransport.flush()
            }
        })
    }

    /**
     * 保存内存队列到 LocalStorage
     */
    private savePendingQueue(): void {
        if (this.pendingQueue.length === 0) return

        try {
            const existingQueue = this.getQueue()
            const combinedQueue = [...existingQueue, ...this.pendingQueue]

            // 容量检查
            const finalQueue = combinedQueue.slice(-this.maxQueueSize)

            localStorage.setItem(this.storageKey, JSON.stringify(finalQueue))
            this.pendingQueue = []
        } catch (error) {
            console.warn('[OfflineTransport] Failed to save pending queue:', error)
        }
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
