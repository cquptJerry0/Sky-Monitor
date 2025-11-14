/**
 * SSE 客户端封装
 *
 * 使用 @microsoft/fetch-event-source 解决 EventSource 无法发送自定义 header 的问题
 */

import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useAuthStore } from '@/stores/auth.store'
import { API_BASE_URL, SSE_CONFIG } from '@/utils/constants'

interface SSEOptions {
    onMessage: (data: unknown) => void
    onError?: (error: Error) => void
    onOpen?: () => void
    onClose?: () => void
}

/**
 * 创建 SSE 连接
 *
 * @param endpoint - SSE 端点路径（如 '/events/stream/errors?appId=xxx'）
 * @param options - 回调选项
 * @returns 清理函数
 */
export function createSSEConnection(endpoint: string, options: SSEOptions) {
    const controller = new AbortController()
    let retryCount = 0

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

    fetchEventSource(url, {
        headers: {
            Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        signal: controller.signal,

        // 消息处理
        onmessage(event) {
            try {
                const data = JSON.parse(event.data)

                // 忽略心跳消息
                if (data.type === 'heartbeat') {
                    console.log('[SSE] Heartbeat received:', data.timestamp)
                    return
                }

                options.onMessage(data)
                retryCount = 0 // 重置重试计数
            } catch (error) {
                console.error('SSE parse error:', error, 'raw data:', event.data)
                // 通知错误处理器
                options.onError?.(error instanceof Error ? error : new Error('SSE parse error'))
            }
        },

        // 错误处理
        onerror(error) {
            console.error('SSE error:', error)
            options.onError?.(error)

            // 重试逻辑
            if (retryCount < SSE_CONFIG.MAX_RETRIES) {
                retryCount++
                console.log(`SSE reconnecting... (${retryCount}/${SSE_CONFIG.MAX_RETRIES})`)
                return SSE_CONFIG.RETRY_DELAY
            }

            // 达到最大重试次数，关闭连接
            console.error('SSE max retries exceeded')
            controller.abort()
            options.onClose?.()
            // 返回 undefined 表示不再重试
            return undefined
        },

        // 连接打开
        async onopen(response) {
            if (response.ok) {
                console.log('SSE connected:', endpoint)
                options.onOpen?.()
            } else {
                console.error('SSE connection failed:', response.status, response.statusText)
                throw new Error(`SSE connection failed: ${response.status}`)
            }
        },

        // 连接关闭
        onclose() {
            console.log('SSE closed:', endpoint)
            options.onClose?.()
        },
    })

    // 返回清理函数
    return () => {
        console.log('SSE aborting:', endpoint)
        controller.abort()
    }
}

/**
 * 构建 SSE 端点 URL（带查询参数）
 */
export function buildSSEUrl(path: string, params: Record<string, string | number | boolean | null | undefined>): string {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, String(value))
        }
    })

    const queryString = searchParams.toString()
    return queryString ? `${path}?${queryString}` : path
}
