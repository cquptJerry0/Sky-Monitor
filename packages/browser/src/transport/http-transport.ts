/**
 * HTTP 传输层实现
 */

import { BaseTransport } from '@sky-monitor/monitor-sdk-core'

export interface HttpTransportOptions {
    url: string
    method?: 'POST' | 'PUT'
    headers?: Record<string, string>
    timeout?: number
}

export class HttpTransport extends BaseTransport {
    constructor(private options: HttpTransportOptions) {
        super()
    }

    async send(data: Record<string, unknown>): Promise<void> {
        try {
            const controller = new AbortController()
            const timeout = this.options.timeout || 10000

            // 设置超时
            const timeoutId = setTimeout(() => controller.abort(), timeout)

            const response = await fetch(this.options.url, {
                method: this.options.method || 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.options.headers,
                },
                body: JSON.stringify(data),
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            this.triggerSuccess()
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error))
            this.triggerError(err)
            throw err
        }
    }
}
