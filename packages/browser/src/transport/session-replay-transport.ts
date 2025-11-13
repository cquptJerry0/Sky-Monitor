/**
 * Session Replay 专用传输层
 *
 * 特点：
 * 1. 不走批量队列，避免阻塞其他事件
 * 2. 支持大数据传输（up to 10MB）
 * 3. 错误时立即上报，平时定期上报
 */

import { Transport } from '@sky-monitor/monitor-sdk-core'
import * as pako from 'pako'

export interface SessionReplayTransportOptions {
    endpoint: string
    immediateOnError?: boolean // 错误时立即上报，默认 true
    flushInterval?: number // 定期上报间隔，默认 10 秒
    compress?: boolean // 是否压缩，默认 true
    maxRetries?: number // 最大重试次数，默认 3
}

export class SessionReplayTransport implements Transport {
    private buffer: any[] = []
    private timer: number | null = null
    private isUploading = false

    constructor(private options: SessionReplayTransportOptions) {
        this.options.immediateOnError = options.immediateOnError !== false
        this.options.flushInterval = options.flushInterval || 10000
        this.options.compress = options.compress !== false
        this.options.maxRetries = options.maxRetries || 3

        this.startPeriodicFlush()
    }

    /**
     * 发送 Session Replay 数据
     *
     * @param data - 包含 events 和 metadata
     */
    async send(data: Record<string, unknown>): Promise<void> {
        // 检查是否是错误触发的录制
        const isErrorTriggered = data.trigger === 'error'

        if (isErrorTriggered && this.options.immediateOnError) {
            // 错误触发：立即上报
            await this.uploadImmediately(data)
        } else {
            // 正常录制：加入缓冲区
            this.buffer.push(data)

            // 如果缓冲区太大，立即刷新
            if (this.getBufferSize() > 1024 * 1024) {
                // 1MB
                await this.flush()
            }
        }
    }

    /**
     * 立即上报（用于错误场景）
     */
    private async uploadImmediately(data: Record<string, unknown>): Promise<void> {
        const payload = this.preparePayload([data])

        try {
            await this.uploadWithRetry(payload)
        } catch (error) {
            // 使用 console.warn 而不是 console.error，避免触发错误监听
            console.warn('[SessionReplay] Failed to upload immediately:', error)
            // 失败后加入缓冲区，等待下次上报
            this.buffer.push(data)
        }
    }

    /**
     * 定期刷新缓冲区
     */
    private startPeriodicFlush(): void {
        this.timer = window.setInterval(() => {
            this.flush()
        }, this.options.flushInterval) as unknown as number
    }

    /**
     * 刷新缓冲区
     */
    async flush(): Promise<void> {
        if (this.buffer.length === 0 || this.isUploading) {
            return
        }

        this.isUploading = true
        const events = [...this.buffer]
        this.buffer = []

        try {
            const payload = this.preparePayload(events)
            await this.uploadWithRetry(payload)
        } catch (error) {
            // 使用 console.warn 而不是 console.error，避免触发错误监听
            console.warn('[SessionReplay] Failed to flush buffer:', error)
            // 失败后重新加入缓冲区
            this.buffer.unshift(...events)
        } finally {
            this.isUploading = false
        }
    }

    /**
     * 准备上传数据
     * 实现 gzip 压缩以减少数据量
     *
     * @param replayEvents - replay 事件对象数组，每个对象包含 replayId, events, metadata, trigger
     */
    private preparePayload(replayEvents: any[]): any {
        // 如果是单个 replay 事件，直接处理
        if (replayEvents.length === 1) {
            const replayEvent = replayEvents[0]
            const rrwebEvents = replayEvent.events || []

            let eventsData: any = rrwebEvents
            let compressed = false
            let originalSize = 0
            let compressedSize = 0

            // 压缩处理（如果启用）
            if (this.options.compress) {
                try {
                    // 序列化为 JSON 字符串
                    const jsonString = JSON.stringify(rrwebEvents)
                    originalSize = jsonString.length

                    // 使用 pako 进行 gzip 压缩
                    const compressedData = pako.gzip(jsonString)

                    // 转换为 Base64 字符串（方便 JSON 传输）
                    const base64String = this.arrayBufferToBase64(compressedData)
                    compressedSize = base64String.length

                    eventsData = base64String
                    compressed = true
                } catch (error) {
                    eventsData = rrwebEvents
                    compressed = false
                }
            }

            const payload = {
                replayId: replayEvent.replayId || `replay_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                events: eventsData,
                metadata: {
                    ...replayEvent.metadata,
                    compressed,
                    originalSize: compressed ? originalSize : replayEvent.metadata?.originalSize || 0,
                    compressedSize: compressed ? compressedSize : 0,
                },
                trigger: replayEvent.trigger || 'manual',
                timestamp: replayEvent.timestamp || new Date().toISOString(),
            }

            return payload
        }

        // 如果是多个 replay 事件（批量），合并处理
        // 这种情况比较少见，暂时简单处理：只发送第一个
        console.warn('[SessionReplayTransport] Multiple replay events in buffer, only sending first one')
        return this.preparePayload([replayEvents[0]])
    }

    /**
     * 将 Uint8Array 转换为 Base64 字符串
     */
    private arrayBufferToBase64(buffer: Uint8Array): string {
        let binary = ''
        const len = buffer.byteLength
        for (let i = 0; i < len; i++) {
            const byte = buffer[i]
            if (byte !== undefined) {
                binary += String.fromCharCode(byte)
            }
        }
        return btoa(binary)
    }

    /**
     * 带重试的上传
     */
    private async uploadWithRetry(payload: any, retries = 0): Promise<void> {
        try {
            const response = await fetch(this.options.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 不设置 Content-Encoding，因为我们发送的是 JSON 格式
                    // events 字段是 Base64 编码的 gzip 数据，不是整个 body 是 gzip
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                // 不抛出错误,只记录日志
                console.error(`[SessionReplayTransport] HTTP ${response.status}: ${response.statusText}`)
                return
            }
        } catch (error) {
            if (retries < (this.options.maxRetries ?? 3)) {
                // 指数退避重试
                const delay = Math.min(1000 * Math.pow(2, retries), 10000)
                await new Promise(resolve => setTimeout(resolve, delay))
                return this.uploadWithRetry(payload, retries + 1)
            }

            // 重试次数用尽,不抛出错误,只记录日志
            console.error('[SessionReplayTransport] Upload failed after retries:', error)
            return
        }
    }

    /**
     * 获取缓冲区大小（字节）
     */
    private getBufferSize(): number {
        return JSON.stringify(this.buffer).length
    }

    /**
     * 关闭传输层
     */
    async close(): Promise<void> {
        if (this.timer !== null) {
            clearInterval(this.timer)
            this.timer = null
        }

        // 最后一次刷新
        await this.flush()
    }

    /**
     * 页面卸载时的处理
     */
    onBeforeUnload(): void {
        if (this.buffer.length > 0) {
            // 使用 sendBeacon 确保数据发送
            const payload = this.preparePayload(this.buffer)
            navigator.sendBeacon(this.options.endpoint, JSON.stringify(payload))
            this.buffer = []
        }
    }
}
