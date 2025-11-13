import { Integration, isErrorEvent, MonitoringEvent } from '../types'

/**
 * 去重配置
 */
export interface DeduplicationConfig {
    /**
     * 缓存容量，默认100
     * 超过容量时删除最旧的记录
     */
    maxCacheSize?: number

    /**
     * 时间窗口（毫秒），默认5000ms
     * 同一错误在窗口内只记录一次
     */
    timeWindow?: number
}

interface CacheEntry {
    fingerprint: string
    timestamp: number
    count: number
}

/**
 * 错误去重集成
 * 通过生成错误指纹实现去重，减少80%噪音数据
 */
export class DeduplicationIntegration implements Integration {
    name = 'Deduplication'

    private cache: Map<string, CacheEntry> = new Map()
    private readonly maxCacheSize: number
    private readonly timeWindow: number

    constructor(config: DeduplicationConfig = {}) {
        this.maxCacheSize = config.maxCacheSize ?? 100
        this.timeWindow = config.timeWindow ?? 5000
    }

    /**
     * 事件发送前处理
     */
    beforeSend(event: MonitoringEvent): MonitoringEvent | null {
        // 对错误类事件、Web Vitals 事件、Performance 事件和 Message 事件去重
        if (!isErrorEvent(event) && event.type !== 'webVital' && event.type !== 'performance' && event.type !== 'message') {
            return event
        }

        const fingerprint = this.generateEventFingerprint(event)
        const now = Date.now()

        // 检查缓存
        const cached = this.cache.get(fingerprint)

        if (cached) {
            // 在时间窗口内，丢弃重复事件
            if (now - cached.timestamp < this.timeWindow) {
                cached.count++
                return null
            }

            // 超过时间窗口，更新缓存并发送
            cached.timestamp = now
            cached.count = 1
        } else {
            // 新事件，添加到缓存
            this.addToCache(fingerprint, now)
        }

        // 附加去重元数据
        event._deduplication = {
            fingerprint,
            count: cached?.count ?? 1,
        }

        return event
    }

    /**
     * 生成事件指纹（统一入口）
     */
    private generateEventFingerprint(event: MonitoringEvent): string {
        if (isErrorEvent(event)) {
            // 检查是否是 HTTP 错误
            if ((event as any).httpError) {
                return this.generateHttpErrorFingerprint(event)
            }
            return this.generateFingerprint(event)
        } else if (event.type === 'webVital') {
            return this.generateWebVitalFingerprint(event)
        } else if (event.type === 'performance') {
            return this.generatePerformanceFingerprint(event)
        } else if (event.type === 'message') {
            return this.generateMessageFingerprint(event)
        }
        return ''
    }

    /**
     * 生成 HTTP 错误指纹
     * 基于：method + url + status
     */
    private generateHttpErrorFingerprint(event: MonitoringEvent): string {
        const httpError = (event as any).httpError
        if (!httpError) {
            return ''
        }

        // 标准化 URL（移除查询参数、哈希、动态 ID）
        const normalizedUrl = this.normalizeUrl(httpError.url)

        const parts = ['http', httpError.method, normalizedUrl, String(httpError.status)]

        return this.hash(parts.join('|'))
    }

    /**
     * 标准化 URL
     * 移除动态部分，保留路径结构
     */
    private normalizeUrl(url: string): string {
        return url
            .replace(/\?.*$/g, '') // 移除查询参数
            .replace(/#.*$/g, '') // 移除哈希
            .replace(/\/\d+/g, '/:id') // 将数字 ID 替换为 :id
            .replace(/\/[a-f0-9]{8,}/g, '/:hash') // 将长哈希替换为 :hash
            .replace(/https?:\/\/[^/]+/g, '') // 移除域名，保留路径
            .substring(0, 200) // 限制长度
    }

    /**
     * 生成 Message 指纹
     * 基于：消息内容
     */
    private generateMessageFingerprint(event: MonitoringEvent): string {
        if (event.type !== 'message') {
            return ''
        }
        const message = this.normalizeMessage(event.message || '')
        return this.hash(`message|${message}`)
    }

    /**
     * 生成 Web Vital 指纹
     * 基于：指标名称 + 路径
     */
    private generateWebVitalFingerprint(event: MonitoringEvent): string {
        if (event.type !== 'webVital') {
            return ''
        }
        const parts = [event.type, event.name, event.path]
        return this.hash(parts.join('|'))
    }

    /**
     * 生成 Performance 事件指纹
     * 基于：事件类型 + 分类 + 名称
     */
    private generatePerformanceFingerprint(event: MonitoringEvent): string {
        if (event.type !== 'performance') {
            return ''
        }
        const parts = [event.type, event.category, event.name]
        return this.hash(parts.join('|'))
    }

    /**
     * 生成错误指纹
     * 基于：错误类型 + 消息 + 堆栈关键行
     */
    private generateFingerprint(event: import('../types').ErrorEvent): string {
        const parts = [event.type, this.normalizeMessage(event.message), this.extractStackKey(event.stack)]

        return this.hash(parts.join('|'))
    }

    /**
     * 标准化错误消息
     * 移除动态内容（如时间戳、ID等）
     */
    private normalizeMessage(message: string = ''): string {
        return message
            .replace(/\d{4}-\d{2}-\d{2}/g, 'DATE') // 日期
            .replace(/\d+ms/g, 'TIMEms') // 时间
            .replace(/id[:=]\s*\w+/gi, 'id=ID') // ID
            .substring(0, 200) // 限制长度
    }

    /**
     * 提取堆栈关键信息
     * 取第一个非第三方库的堆栈行
     */
    private extractStackKey(stack: string = ''): string {
        const lines = stack.split('\n').slice(0, 3) // 只看前3行
        return lines
            .filter(line => !line.includes('node_modules'))
            .join('|')
            .substring(0, 200)
    }

    /**
     * 简单哈希函数
     */
    private hash(str: string): string {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = (hash << 5) - hash + char
            hash = hash & hash // Convert to 32bit integer
        }
        return hash.toString(36)
    }

    /**
     * 添加到缓存（LRU策略）
     */
    private addToCache(fingerprint: string, timestamp: number): void {
        // 超过容量，删除最旧的
        if (this.cache.size >= this.maxCacheSize) {
            const oldestKey = this.cache.keys().next().value
            this.cache.delete(oldestKey as string)
        }

        this.cache.set(fingerprint, {
            fingerprint,
            timestamp,
            count: 1,
        })
    }
}
