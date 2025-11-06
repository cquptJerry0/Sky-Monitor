import { captureEvent, getCurrentClient, Integration } from '@sky-monitor/monitor-sdk-core'

import { BrowserErrorEvent } from '../types/errorTypes'
import { collectDeviceInfo, collectNetworkInfo } from '../utils/deviceInfo'
import { generateErrorFingerprint, errorDeduplicator } from '../utils/errorFingerprint'

/**
 * HTTP 错误集成配置
 */
export interface HttpErrorIntegrationOptions {
    captureSuccessfulRequests?: boolean // 是否捕获成功的请求，默认 false
    captureHeaders?: boolean // 是否捕获请求头和响应头，默认 false
    captureBody?: boolean // 是否捕获请求体和响应体，默认 false
    failedStatusCodes?: number[] // 被视为失败的状态码，默认 [400-599]
    sensitiveHeaders?: string[] // 敏感的 header 名称（需要脱敏），默认包含 Authorization, Cookie
    enableDeduplication?: boolean // 是否启用错误去重，默认 true
}

/**
 * HTTP 错误捕获集成
 */
export class HttpErrorIntegration implements Integration {
    name = 'HttpError'
    private options: Required<HttpErrorIntegrationOptions>
    private deviceInfo?: ReturnType<typeof collectDeviceInfo>
    private networkInfo?: ReturnType<typeof collectNetworkInfo>

    private originalFetch?: typeof fetch
    private originalXHROpen?: typeof XMLHttpRequest.prototype.open
    private originalXHRSend?: typeof XMLHttpRequest.prototype.send

    constructor(options: HttpErrorIntegrationOptions = {}) {
        this.options = {
            captureSuccessfulRequests: options.captureSuccessfulRequests || false,
            captureHeaders: options.captureHeaders || false,
            captureBody: options.captureBody || false,
            failedStatusCodes: options.failedStatusCodes || this.getDefaultFailedCodes(),
            sensitiveHeaders: options.sensitiveHeaders || ['authorization', 'cookie', 'x-api-key', 'x-auth-token'],
            enableDeduplication: options.enableDeduplication !== false,
        }
    }

    /**
     * 默认的失败状态码范围
     */
    private getDefaultFailedCodes(): number[] {
        const codes: number[] = []
        for (let i = 400; i <= 599; i++) {
            codes.push(i)
        }
        return codes
    }

    /**
     * 全局初始化
     */
    setupOnce(): void {
        // 收集设备和网络信息
        this.deviceInfo = collectDeviceInfo()
        this.networkInfo = collectNetworkInfo()

        // 劫持 fetch
        this.instrumentFetch()

        // 劫持 XMLHttpRequest
        this.instrumentXHR()
    }

    /**
     * 劫持 fetch API
     */
    private instrumentFetch(): void {
        if (!window.fetch) return

        this.originalFetch = window.fetch
        const originalFetch = this.originalFetch

        window.fetch = (...args: Parameters<typeof fetch>): Promise<Response> => {
            const startTime = Date.now()
            const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : String(args[0])
            const options = args[1] || {}
            const method = options.method || 'GET'

            return originalFetch(...args)
                .then(response => {
                    const duration = Date.now() - startTime

                    // 检查是否需要上报
                    if (this.shouldCaptureRequest(response.status)) {
                        this.captureHttpError({
                            url,
                            method,
                            status: response.status,
                            statusText: response.statusText,
                            duration,
                            requestHeaders: this.options.captureHeaders ? this.sanitizeHeaders(options.headers) : undefined,
                            responseHeaders: this.options.captureHeaders ? this.extractResponseHeaders(response) : undefined,
                            requestBody: this.options.captureBody ? options.body : undefined,
                        })
                    }

                    return response
                })
                .catch(error => {
                    const duration = Date.now() - startTime

                    // 网络错误或其他异常
                    this.captureHttpError({
                        url,
                        method,
                        status: 0, // 0 表示网络错误
                        statusText: error.message || 'Network Error',
                        duration,
                        requestHeaders: this.options.captureHeaders ? this.sanitizeHeaders(options.headers) : undefined,
                        requestBody: this.options.captureBody ? options.body : undefined,
                    })

                    throw error
                })
        }
    }

    /**
     * 劫持 XMLHttpRequest
     */
    private instrumentXHR(): void {
        if (!window.XMLHttpRequest) return

        this.originalXHROpen = XMLHttpRequest.prototype.open
        this.originalXHRSend = XMLHttpRequest.prototype.send
        const originalXHROpen = this.originalXHROpen
        const originalXHRSend = this.originalXHRSend

        // 劫持 open 方法
        XMLHttpRequest.prototype.open = function (
            method: string,
            url: string | URL,
            async?: boolean,
            username?: string | null,
            password?: string | null
        ) {
            const xhr = this as any
            xhr.__sky_monitor__ = {
                method,
                url: String(url),
                startTime: Date.now(),
                requestHeaders: {},
            }

            return originalXHROpen.call(this, method, url, async !== false, username, password)
        }

        // 保存原始的 setRequestHeader
        const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader
        const captureHeaders = this.options.captureHeaders
        XMLHttpRequest.prototype.setRequestHeader = function (name: string, value: string) {
            const xhr = this as any
            if (xhr.__sky_monitor__ && captureHeaders) {
                xhr.__sky_monitor__.requestHeaders[name] = value
            }
            return originalSetRequestHeader.call(this, name, value)
        }

        // 劫持 send 方法
        const captureBody = this.options.captureBody
        const shouldCaptureRequest = this.shouldCaptureRequest.bind(this)
        const captureHttpError = this.captureHttpError.bind(this)
        const sanitizeHeaders = this.sanitizeHeaders.bind(this)
        const extractXHRResponseHeaders = this.extractXHRResponseHeaders.bind(this)

        XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
            const xhr = this as any
            const monitorData = xhr.__sky_monitor__

            if (!monitorData) {
                return originalXHRSend.call(this, body)
            }

            // 保存请求体
            if (captureBody) {
                monitorData.requestBody = body
            }

            // 监听响应
            this.addEventListener('loadend', () => {
                const duration = Date.now() - monitorData.startTime

                // 检查是否需要上报
                if (shouldCaptureRequest(xhr.status)) {
                    captureHttpError({
                        url: monitorData.url,
                        method: monitorData.method,
                        status: xhr.status,
                        statusText: xhr.statusText,
                        duration,
                        requestHeaders: captureHeaders ? sanitizeHeaders(monitorData.requestHeaders) : undefined,
                        responseHeaders: captureHeaders ? extractXHRResponseHeaders(xhr) : undefined,
                        requestBody: monitorData.requestBody,
                        responseBody: captureBody ? xhr.responseText : undefined,
                    })
                }
            })

            return originalXHRSend.call(this, body)
        }
    }

    /**
     * 判断是否应该捕获该请求
     */
    private shouldCaptureRequest(status: number): boolean {
        // status === 0 表示网络错误
        if (status === 0) return true

        // 检查是否在失败状态码列表中
        if (this.options.failedStatusCodes.includes(status)) return true

        // 是否捕获成功请求
        return this.options.captureSuccessfulRequests
    }

    /**
     * 提取 Response 的 headers
     */
    private extractResponseHeaders(response: Response): Record<string, string> {
        const headers: Record<string, string> = {}
        response.headers.forEach((value, key) => {
            headers[key] = value
        })
        return this.sanitizeHeaders(headers)
    }

    /**
     * 提取 XHR 的 response headers
     */
    private extractXHRResponseHeaders(xhr: XMLHttpRequest): Record<string, string> {
        const headersString = xhr.getAllResponseHeaders()
        const headers: Record<string, string> = {}

        if (headersString) {
            const lines = headersString.trim().split('\n')
            for (const line of lines) {
                const [key, value] = line.split(':').map(s => s.trim())
                if (key && value) {
                    headers[key.toLowerCase()] = value
                }
            }
        }

        return this.sanitizeHeaders(headers)
    }

    /**
     * 脱敏敏感的 headers
     */
    private sanitizeHeaders(headers: any): Record<string, string> {
        if (!headers) return {}

        const sanitized: Record<string, string> = {}

        // 如果是 Headers 对象
        if (headers instanceof Headers) {
            headers.forEach((value, key) => {
                const lowerKey = key.toLowerCase()
                sanitized[key] = this.options.sensitiveHeaders.includes(lowerKey) ? '[REDACTED]' : value
            })
        }
        // 如果是普通对象
        else if (typeof headers === 'object') {
            for (const [key, value] of Object.entries(headers)) {
                const lowerKey = key.toLowerCase()
                sanitized[key] = this.options.sensitiveHeaders.includes(lowerKey) ? '[REDACTED]' : String(value)
            }
        }

        return sanitized
    }

    /**
     * 捕获 HTTP 错误
     *
     * @description
     * 核心功能：
     * 1. 生成错误指纹（基于 method + url + status）
     * 2. 执行去重检查（避免短时间内重复上报）
     * 3. 从全局客户端获取 release 和 appId（用于 SourceMap 匹配）
     * 4. 构建完整的错误事件并上报
     */
    private captureHttpError(details: {
        url: string
        method: string
        status: number
        statusText: string
        duration: number
        requestHeaders?: Record<string, string>
        responseHeaders?: Record<string, string>
        requestBody?: any
        responseBody?: any
    }): void {
        const { url, method, status, statusText, duration } = details

        // 生成错误指纹
        const fingerprint = generateErrorFingerprint(`${method} ${url} ${status}`, `HTTP ${status}: ${method} ${url}`, 'http')

        // 错误去重检查
        if (this.options.enableDeduplication && !errorDeduplicator.shouldReport(fingerprint.hash)) {
            return
        }

        // 获取全局客户端实例，提取 release 和 appId
        // 这些信息对于后端非常重要：
        // - release: 用于匹配对应版本的 SourceMap 文件
        // - appId: 用于区分不同应用的错误
        const client = getCurrentClient()
        const release = (client as any)?.release
        const appId = (client as any)?.appId
        const environment = (client as any)?.environment

        const event: BrowserErrorEvent = {
            type: 'error',
            message: `HTTP ${status} ${statusText}: ${method} ${url}`,
            timestamp: new Date().toISOString(),
            errorFingerprint: fingerprint,
            release,
            appId,
            environment,
            httpError: {
                url,
                method,
                status,
                statusText,
                duration,
                requestHeaders: details.requestHeaders,
                responseHeaders: details.responseHeaders,
                requestBody: details.requestBody,
                responseBody: details.responseBody,
            },
            device: this.deviceInfo,
            network: this.networkInfo,
        }

        captureEvent(event)
    }
}
