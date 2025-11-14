import { Transport } from '@sky-monitor/monitor-sdk-core'
import { IndexedDBStorage, QueueItem, isIndexedDBSupported } from '../storage/indexedDB'

/**
 * 离线传输配置
 */
export interface OfflineTransportOptions {
    /**
     * IndexedDB 数据库名，默认 'sky-monitor-offline'
     */
    dbName?: string

    /**
     * IndexedDB 对象存储名，默认 'queue'
     */
    storeName?: string

    /**
     * 最大缓存事件数，默认30
     */
    maxQueueSize?: number

    /**
     * 重试间隔（毫秒），默认10000ms
     */
    retryInterval?: number

    /**
     * 启动时是否立即发送队列，默认 true
     */
    flushAtStartup?: boolean
}

/**
 * 离线传输包装器
 * 使用 IndexedDB 存储离线事件，网络恢复后自动重试
 *
 * 改进的保存机制：
 * 1. 检测到发送失败时立即保存到 IndexedDB
 * 2. 监听 online/offline 事件
 * 3. 定时重试发送队列中的事件
 * 4. 启动时自动发送队列中的事件
 */
export class OfflineTransport implements Transport {
    private storage: IndexedDBStorage | null = null
    private readonly retryInterval: number
    private readonly flushAtStartup: boolean
    private retryTimer: number | null = null
    private isSending = false

    constructor(
        private innerTransport: Transport,
        options: OfflineTransportOptions = {}
    ) {
        this.retryInterval = options.retryInterval ?? 10000
        this.flushAtStartup = options.flushAtStartup ?? true

        // 检查 IndexedDB 支持
        if (isIndexedDBSupported()) {
            this.storage = new IndexedDBStorage({
                dbName: options.dbName,
                storeName: options.storeName,
                maxQueueSize: options.maxQueueSize,
            })
        } else {
            console.warn('[OfflineTransport] IndexedDB not supported, offline caching disabled')
        }

        this.setupNetworkListener()
        this.startRetryTimer()

        // 初始化时尝试发送队列中的数据
        if (this.flushAtStartup) {
            this.processQueue()
        }
    }

    /**
     * 发送数据
     */
    send(data: Record<string, unknown>): void {
        if (this.isOnline()) {
            // 在线状态：尝试发送
            this.trySend(data)
        } else {
            // 离线状态：直接保存到 IndexedDB
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
    private async trySend(data: Record<string, unknown>): Promise<void> {
        try {
            // 调用 innerTransport.send()
            await this.innerTransport.send(data)

            // 发送成功，尝试处理队列中的数据
            if (this.storage) {
                const queue = await this.storage.getAll()
                if (queue.length > 0) {
                    this.processQueue()
                }
            }
        } catch (error) {
            // innerTransport 抛出异常，保存到 IndexedDB
            await this.saveToStorage(data)
        }
    }

    /**
     * 保存到 IndexedDB
     */
    private async saveToStorage(data: Record<string, unknown>): Promise<void> {
        if (!this.storage) {
            console.warn('[OfflineTransport] IndexedDB not available, cannot save event')
            return
        }

        try {
            const item: QueueItem = {
                id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                data,
                timestamp: Date.now(),
                retryCount: 0,
            }

            await this.storage.store(item)
            console.log('[OfflineTransport] Event saved to IndexedDB:', item.id)
        } catch (error) {
            console.error('[OfflineTransport] Failed to save to IndexedDB:', error)
        }
    }

    /**
     * 处理队列（重试发送）
     */
    private async processQueue(): Promise<void> {
        if (!this.isOnline() || this.isSending || !this.storage) return

        const queue = await this.storage.getAll()
        if (queue.length === 0) return

        console.log(`[OfflineTransport] Processing queue: ${queue.length} items`)
        this.isSending = true

        // 逐个尝试发送
        for (const item of queue) {
            try {
                await this.innerTransport.send(item.data)

                // 发送成功，从 IndexedDB 中删除
                await this.storage.remove(item.id)
                console.log('[OfflineTransport] Event sent successfully, removed from queue:', item.id)
            } catch (error) {
                // 发送失败，增加重试次数
                console.error('[OfflineTransport] Error processing queue item:', error)
                item.retryCount++

                // 最多重试3次
                if (item.retryCount >= 3) {
                    await this.storage.remove(item.id)
                    console.log('[OfflineTransport] Max retries reached, removed from queue:', item.id)
                }
            }
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
            console.log('[OfflineTransport] Network online, processing queue')
            this.processQueue()
        })

        // 监听网络断开
        window.addEventListener('offline', () => {
            console.log('[OfflineTransport] Network offline')
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
