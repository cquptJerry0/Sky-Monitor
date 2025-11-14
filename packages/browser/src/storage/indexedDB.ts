/**
 * IndexedDB 封装，用于离线事件存储
 */

export interface QueueItem {
    id: string
    data: Record<string, unknown>
    timestamp: number
    retryCount: number
}

export interface IndexedDBOptions {
    dbName?: string
    storeName?: string
    maxQueueSize?: number
}

const DEFAULT_DB_NAME = 'sky-monitor-offline'
const DEFAULT_STORE_NAME = 'queue'
const DEFAULT_MAX_QUEUE_SIZE = 30

export class IndexedDBStorage {
    private dbName: string
    private storeName: string
    private maxQueueSize: number
    private dbPromise: Promise<IDBDatabase> | null = null

    constructor(options: IndexedDBOptions = {}) {
        this.dbName = options.dbName || DEFAULT_DB_NAME
        this.storeName = options.storeName || DEFAULT_STORE_NAME
        this.maxQueueSize = options.maxQueueSize || DEFAULT_MAX_QUEUE_SIZE
    }

    /**
     * 打开或创建 IndexedDB 数据库
     */
    private async openDB(): Promise<IDBDatabase> {
        if (this.dbPromise) {
            return this.dbPromise
        }

        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1)

            request.onerror = () => {
                reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`))
            }

            request.onsuccess = () => {
                resolve(request.result)
            }

            request.onupgradeneeded = event => {
                const db = (event.target as IDBOpenDBRequest).result
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' })
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false })
                }
            }
        })

        return this.dbPromise
    }

    /**
     * 存储事件到 IndexedDB
     */
    async store(item: QueueItem): Promise<void> {
        try {
            const db = await this.openDB()

            // 先检查队列大小并删除最旧的事件（如果需要）
            const count = await this.getCount()
            if (count >= this.maxQueueSize) {
                await this.removeOldest()
            }

            // 创建新的 transaction 来添加事件
            // 注意：不能在 await 之后使用之前的 transaction，因为它已经自动提交了
            const transaction = db.transaction([this.storeName], 'readwrite')
            const objectStore = transaction.objectStore(this.storeName)

            return new Promise((resolve, reject) => {
                const request = objectStore.add(item)
                request.onsuccess = () => resolve()
                request.onerror = () => reject(new Error(`Failed to store item: ${request.error?.message}`))
            })
        } catch (error) {
            console.error('[IndexedDBStorage] Failed to store item:', error)
            throw error
        }
    }

    /**
     * 获取队列中的所有事件
     */
    async getAll(): Promise<QueueItem[]> {
        try {
            const db = await this.openDB()
            const transaction = db.transaction([this.storeName], 'readonly')
            const objectStore = transaction.objectStore(this.storeName)

            return new Promise((resolve, reject) => {
                const request = objectStore.getAll()
                request.onsuccess = () => resolve(request.result || [])
                request.onerror = () => reject(new Error(`Failed to get all items: ${request.error?.message}`))
            })
        } catch (error) {
            console.error('[IndexedDBStorage] Failed to get all items:', error)
            return []
        }
    }

    /**
     * 删除指定 ID 的事件
     */
    async remove(id: string): Promise<void> {
        try {
            const db = await this.openDB()
            const transaction = db.transaction([this.storeName], 'readwrite')
            const objectStore = transaction.objectStore(this.storeName)

            return new Promise((resolve, reject) => {
                const request = objectStore.delete(id)
                request.onsuccess = () => resolve()
                request.onerror = () => reject(new Error(`Failed to remove item: ${request.error?.message}`))
            })
        } catch (error) {
            console.error('[IndexedDBStorage] Failed to remove item:', error)
            throw error
        }
    }

    /**
     * 清空队列
     */
    async clear(): Promise<void> {
        try {
            const db = await this.openDB()
            const transaction = db.transaction([this.storeName], 'readwrite')
            const objectStore = transaction.objectStore(this.storeName)

            return new Promise((resolve, reject) => {
                const request = objectStore.clear()
                request.onsuccess = () => resolve()
                request.onerror = () => reject(new Error(`Failed to clear store: ${request.error?.message}`))
            })
        } catch (error) {
            console.error('[IndexedDBStorage] Failed to clear store:', error)
            throw error
        }
    }

    /**
     * 获取队列中的事件数量
     */
    private async getCount(): Promise<number> {
        try {
            const db = await this.openDB()
            const transaction = db.transaction([this.storeName], 'readonly')
            const objectStore = transaction.objectStore(this.storeName)

            return new Promise((resolve, reject) => {
                const request = objectStore.count()
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(new Error(`Failed to get count: ${request.error?.message}`))
            })
        } catch (error) {
            console.error('[IndexedDBStorage] Failed to get count:', error)
            return 0
        }
    }

    /**
     * 删除最旧的事件
     */
    private async removeOldest(): Promise<void> {
        try {
            const db = await this.openDB()
            const transaction = db.transaction([this.storeName], 'readwrite')
            const objectStore = transaction.objectStore(this.storeName)
            const index = objectStore.index('timestamp')

            return new Promise((resolve, reject) => {
                const request = index.openCursor()
                request.onsuccess = event => {
                    const cursor = (event.target as IDBRequest).result
                    if (cursor) {
                        cursor.delete()
                        resolve()
                    } else {
                        resolve()
                    }
                }
                request.onerror = () => reject(new Error(`Failed to remove oldest item: ${request.error?.message}`))
            })
        } catch (error) {
            console.error('[IndexedDBStorage] Failed to remove oldest item:', error)
            throw error
        }
    }
}

/**
 * 检查浏览器是否支持 IndexedDB
 */
export function isIndexedDBSupported(): boolean {
    return typeof indexedDB !== 'undefined'
}
