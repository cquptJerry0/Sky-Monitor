import { captureEvent, Integration } from '@sky-monitor/monitor-sdk-core'

import { BrowserErrorEvent } from '../types/errorTypes'
import { collectDeviceInfo, collectNetworkInfo } from '../utils/deviceInfo'
import { generateErrorFingerprint, errorDeduplicator } from '../utils/errorFingerprint'
import { enhanceStack } from '../utils/stackTrace'

/**
 * 错误捕获集成配置
 */
export interface ErrorsOptions {
    captureResourceErrors?: boolean // 是否捕获资源加载错误，默认 true
    collectDeviceInfo?: boolean // 是否收集设备信息，默认 true
    collectNetworkInfo?: boolean // 是否收集网络信息，默认 true
    enableDeduplication?: boolean // 是否启用错误去重，默认 true
}

/**
 * 错误捕获集成
 */
export class Errors implements Integration {
    name = 'Errors'
    private options: Required<ErrorsOptions>
    private deviceInfo?: ReturnType<typeof collectDeviceInfo>
    private networkInfo?: ReturnType<typeof collectNetworkInfo>

    constructor(options: ErrorsOptions = {}) {
        this.options = {
            captureResourceErrors: options.captureResourceErrors !== false,
            collectDeviceInfo: options.collectDeviceInfo !== false,
            collectNetworkInfo: options.collectNetworkInfo !== false,
            enableDeduplication: options.enableDeduplication !== false,
        }
    }

    /**
     * 全局初始化，仅执行一次
     * 注册全局错误监听器
     */
    setupOnce(): void {
        // 收集设备和网络信息（仅一次）
        if (this.options.collectDeviceInfo) {
            this.deviceInfo = collectDeviceInfo()
        }
        if (this.options.collectNetworkInfo) {
            this.networkInfo = collectNetworkInfo()
        }

        // 注册全局错误监听
        window.onerror = this.handleError.bind(this)
        window.onunhandledrejection = this.handleRejection.bind(this)

        // 注册资源加载错误监听（捕获阶段）
        if (this.options.captureResourceErrors) {
            window.addEventListener('error', this.handleResourceError.bind(this), true)
        }
    }

    /**
     * 处理全局运行时错误
     */
    private handleError(message: string | Event, source?: string, lineno?: number, colno?: number, error?: Error): void {
        const errorMessage = typeof message === 'string' ? message : String(message)
        const fullMessage = source ? `${errorMessage} at ${source}` : errorMessage

        // 生成错误指纹
        const fingerprint = generateErrorFingerprint(error || fullMessage, fullMessage, 'error')

        // 错误去重检查
        if (this.options.enableDeduplication && !errorDeduplicator.shouldReport(fingerprint.hash)) {
            return
        }

        const event: BrowserErrorEvent = {
            type: 'error',
            message: fullMessage,
            lineno,
            colno,
            stack: error ? enhanceStack(error) : undefined,
            path: window.location.pathname,
            timestamp: new Date().toISOString(),
            errorFingerprint: fingerprint,
            device: this.deviceInfo,
            network: this.networkInfo,
        }

        captureEvent(event)
    }

    /**
     * 处理未捕获的Promise拒绝
     */
    private handleRejection(event: PromiseRejectionEvent): void {
        const reason = event.reason
        const message = String(reason)
        const error = reason instanceof Error ? reason : new Error(message)

        // 生成错误指纹
        const fingerprint = generateErrorFingerprint(error, message, 'unhandledrejection')

        // 错误去重检查
        if (this.options.enableDeduplication && !errorDeduplicator.shouldReport(fingerprint.hash)) {
            return
        }

        const errorEvent: BrowserErrorEvent = {
            type: 'unhandledrejection',
            message,
            stack: reason?.stack || error.stack,
            path: window.location.pathname,
            timestamp: new Date().toISOString(),
            errorFingerprint: fingerprint,
            device: this.deviceInfo,
            network: this.networkInfo,
        }

        captureEvent(errorEvent)
    }

    /**
     * 处理资源加载错误
     */
    private handleResourceError(event: ErrorEvent | Event): void {
        // 只处理真正的资源加载错误
        const target = event.target as HTMLElement | null
        if (!target || target === window) {
            return
        }

        const tagName = target.tagName?.toLowerCase()
        if (!tagName || !['img', 'script', 'link', 'video', 'audio'].includes(tagName)) {
            return
        }

        // 获取资源 URL
        const url = (target as HTMLImageElement | HTMLScriptElement).src || (target as HTMLLinkElement).href || 'unknown'

        // 生成错误指纹
        const fingerprint = generateErrorFingerprint(url, `Resource failed: ${url}`, 'resource')

        // 错误去重检查
        if (this.options.enableDeduplication && !errorDeduplicator.shouldReport(fingerprint.hash)) {
            return
        }

        const resourceEvent: BrowserErrorEvent = {
            type: 'resourceError',
            message: `Failed to load ${tagName}: ${url}`,
            path: window.location.pathname,
            timestamp: new Date().toISOString(),
            errorFingerprint: fingerprint,
            resourceError: {
                url,
                tagName,
                resourceType: tagName as any,
                outerHTML: target.outerHTML?.slice(0, 200), // 限制长度
            },
            device: this.deviceInfo,
            network: this.networkInfo,
        }

        captureEvent(resourceEvent)
    }
}
