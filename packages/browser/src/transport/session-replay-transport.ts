/**
 * Session Replay 专用传输层
 *
 * 特点：
 * 1. 不走批量队列，避免阻塞其他事件
 * 2. 支持大数据传输（up to 10MB）
 * 3. 错误时立即上报，平时定期上报
 */

import { Transport } from '@sky-monitor/monitor-sdk-core'

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
            console.error('[SessionReplay] Failed to upload immediately:', error)
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
            console.error('[SessionReplay] Failed to flush buffer:', error)
            // 失败后重新加入缓冲区
            this.buffer.unshift(...events)
        } finally {
            this.isUploading = false
        }
    }

    /**
     * 准备上传数据
     */
    private preparePayload(events: any[]): any {
        const payload = {
            events,
            metadata: {
                count: events.length,
                timestamp: new Date().toISOString(),
                compressed: this.options.compress,
            },
        }

        // 压缩处理（如果启用）
        if (this.options.compress) {
            // 实际项目中使用 pako 或其他压缩库
            // import pako from 'pako'
            // payload.data = pako.gzip(JSON.stringify(events))
        }

        return payload
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
                    ...(this.options.compress && { 'Content-Encoding': 'gzip' }),
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
        } catch (error) {
            if (retries < this.options.maxRetries) {
                // 指数退避重试
                const delay = Math.min(1000 * Math.pow(2, retries), 10000)
                await new Promise(resolve => setTimeout(resolve, delay))
                return this.uploadWithRetry(payload, retries + 1)
            }
            throw error
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
