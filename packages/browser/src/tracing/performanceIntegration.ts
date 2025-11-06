import { captureEvent, Integration } from '@sky-monitor/monitor-sdk-core'

/**
 * 性能配置
 */
export interface PerformanceConfig {
    /**
     * 是否监控Fetch，默认true
     */
    traceFetch?: boolean

    /**
     * 是否监控XHR，默认true
     */
    traceXHR?: boolean

    /**
     * 慢请求阈值（毫秒），默认3000ms
     */
    slowRequestThreshold?: number

    /**
     * 是否上报所有请求，默认false（只上报慢请求和失败请求）
     */
    traceAllRequests?: boolean
}

interface RequestInfo {
    url: string
    method: string
    startTime: number
}

/**
 * 性能耗时监控集成
 * 拦截 Fetch 和 XHR，记录接口耗时
 */
export class PerformanceIntegration implements Integration {
    name = 'Performance'

    private readonly config: Required<PerformanceConfig>
    private originalFetch?: typeof fetch
    private originalXHROpen?: typeof XMLHttpRequest.prototype.open
    private originalXHRSend?: typeof XMLHttpRequest.prototype.send
    private isSetup = false

    constructor(config: PerformanceConfig = {}) {
        this.config = {
            traceFetch: config.traceFetch ?? true,
            traceXHR: config.traceXHR ?? true,
            slowRequestThreshold: config.slowRequestThreshold ?? 3000,
            traceAllRequests: config.traceAllRequests ?? false,
        }
    }

    /**
     * 全局初始化
     */
    setupOnce(): void {
        if (this.isSetup) {
            return
        }
        this.isSetup = true

        if (this.config.traceFetch) {
            this.instrumentFetch()
        }

        if (this.config.traceXHR) {
            this.instrumentXHR()
        }
    }

    /**
     * 拦截 Fetch API
     */
    private instrumentFetch(): void {
        if (typeof window === 'undefined' || !window.fetch) return

        this.originalFetch = window.fetch
        const originalFetch = this.originalFetch

        const handleResponse = this.handleResponse.bind(this)
        const handleError = this.handleError.bind(this)

        window.fetch = function (input: any, init?: RequestInit): Promise<Response> {
            const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input)
            const method = init?.method?.toUpperCase() || 'GET'
            const startTime = performance.now()

            const request = { url, method, startTime }

            return originalFetch
                .call(this, input, init)
                .then((response: Response) => {
                    handleResponse(request, response.status, response.ok)
                    return response
                })
                .catch((error: Error) => {
                    handleError(request, error)
                    throw error
                })
        }
    }

    /**
     * 拦截 XMLHttpRequest
     */
    private instrumentXHR(): void {
        if (typeof window === 'undefined' || !window.XMLHttpRequest) return

        this.originalXHROpen = XMLHttpRequest.prototype.open
        this.originalXHRSend = XMLHttpRequest.prototype.send
        const originalXHROpen = this.originalXHROpen
        const originalXHRSend = this.originalXHRSend

        XMLHttpRequest.prototype.open = function (
            method: string,
            url: string | URL,
            async?: boolean,
            username?: string | null,
            password?: string | null
        ) {
            const urlString = typeof url === 'string' ? url : url.toString()
            ;(this as any).__skyMonitor = {
                url: urlString,
                method: method.toUpperCase(),
            }
            return originalXHROpen.apply(this, [method, url, async ?? true, username, password])
        }

        const handleResponse = this.handleResponse.bind(this)
        const handleError = this.handleError.bind(this)

        XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const xhrInstance = this
            const request = (xhrInstance as any).__skyMonitor as RequestInfo | undefined

            if (request) {
                request.startTime = performance.now()

                xhrInstance.addEventListener('loadend', () => {
                    handleResponse(request, xhrInstance.status, xhrInstance.status >= 200 && xhrInstance.status < 300)
                })

                xhrInstance.addEventListener('error', () => {
                    handleError(request, new Error('Network Error'))
                })

                xhrInstance.addEventListener('timeout', () => {
                    handleError(request, new Error('Timeout'))
                })
            }

            return originalXHRSend.apply(this, [body])
        }
    }

    /**
     * 处理响应
     */
    private handleResponse(request: RequestInfo, status: number, ok: boolean): void {
        const duration = performance.now() - request.startTime
        const isSlow = duration > this.config.slowRequestThreshold

        // 根据配置决定是否上报
        const shouldReport = this.config.traceAllRequests || isSlow || !ok

        if (shouldReport) {
            captureEvent({
                type: 'performance',
                category: 'http',
                url: request.url,
                method: request.method,
                status,
                duration: Math.round(duration),
                isSlow,
                success: ok,
                timestamp: new Date().toISOString(),
            })
        }
    }

    /**
     * 处理错误
     */
    private handleError(request: RequestInfo, error: Error): void {
        const duration = performance.now() - request.startTime

        captureEvent({
            type: 'performance',
            category: 'http',
            url: request.url,
            method: request.method,
            status: 0,
            duration: Math.round(duration),
            error: error.message,
            success: false,
            timestamp: new Date().toISOString(),
        })
    }

    /**
     * 清理资源
     */
    cleanup(): void {
        if (this.originalFetch && typeof window !== 'undefined') {
            window.fetch = this.originalFetch
            this.originalFetch = undefined
        }

        if (this.originalXHROpen) {
            XMLHttpRequest.prototype.open = this.originalXHROpen
            this.originalXHROpen = undefined
        }

        if (this.originalXHRSend) {
            XMLHttpRequest.prototype.send = this.originalXHRSend
            this.originalXHRSend = undefined
        }

        this.isSetup = false
    }
}

// 扩展 XMLHttpRequest 类型
declare global {
    interface XMLHttpRequest {
        __skyMonitor?: {
            url: string
            method: string
            startTime?: number
        }
    }
}
