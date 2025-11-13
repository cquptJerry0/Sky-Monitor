import { captureEvent, Integration, MonitoringEvent, getCurrentClient } from '@sky-monitor/monitor-sdk-core'

import { BrowserErrorEvent } from '../types/errorTypes'
import { collectDeviceInfo, collectNetworkInfo } from '../utils/deviceInfo'
import { generateErrorFingerprint } from '../utils/errorFingerprint'
import { enhanceStack } from '../utils/stackTrace'
import { SessionReplayIntegration } from '../integrations/sessionReplay'

/**
 * 错误捕获集成配置
 */
export interface ErrorsOptions {
    captureResourceErrors?: boolean // 是否捕获资源加载错误，默认 true
    collectDeviceInfo?: boolean // 是否收集设备信息，默认 true
    collectNetworkInfo?: boolean // 是否收集网络信息，默认 true
    enableDeduplication?: boolean // 是否启用错误去重，默认 true
    filterSdkErrors?: boolean // 是否过滤 SDK 自身错误，默认 true
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
            filterSdkErrors: options.filterSdkErrors !== false,
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
     * 检查错误是否来自 SDK 内部
     * 通过堆栈跟踪判断错误是否由 SDK 代码引起
     */
    private isSdkError(error: Error | string, stack?: string): boolean {
        if (!this.options.filterSdkErrors) {
            return false
        }

        const stackTrace = typeof error === 'string' ? stack : error instanceof Error ? error.stack : stack

        if (!stackTrace) {
            return false
        }

        // SDK 内部文件的特征
        const sdkPatterns = [
            '@sky-monitor/monitor-sdk',
            '/monitor-sdk-',
            '/sky-monitor/',
            'transport/index',
            'transport/batched',
            'transport/offline',
            'transport/session-replay',
            'transport/transport-router',
            'tracing/errorsIntegration',
            'integrations/sessionReplay',
            'integrations/httpErrorIntegration',
        ]

        // 检查堆栈中是否包含 SDK 内部文件
        return sdkPatterns.some(pattern => stackTrace.includes(pattern))
    }

    /**
     * 处理全局运行时错误
     *
     * 注意：去重逻辑已移至 DeduplicationIntegration（Core 层），避免重复去重
     */
    private handleError(message: string | Event, source?: string, lineno?: number, colno?: number, error?: Error): void {
        const errorMessage = typeof message === 'string' ? message : String(message)
        const fullMessage = source ? `${errorMessage} at ${source}` : errorMessage

        // 过滤 SDK 自身错误
        if (error && this.isSdkError(error)) {
            console.warn('[Sky-Monitor] SDK internal error filtered:', fullMessage)
            return
        }

        // 生成错误指纹（用于后端分析，不用于去重）
        const fingerprint = generateErrorFingerprint(error || fullMessage, fullMessage, 'error')

        const event: BrowserErrorEvent = {
            type: 'error',
            message: fullMessage,
            lineno,
            colno,
            stack: error ? enhanceStack(error) : undefined,
            timestamp: new Date().toISOString(),
            errorFingerprint: fingerprint,
            device: this.deviceInfo,
            network: this.networkInfo,
        }

        captureEvent(event)
    }

    /**
     * 处理未捕获的Promise拒绝
     *
     * 注意：去重逻辑已移至 DeduplicationIntegration（Core 层），避免重复去重
     */
    private handleRejection(event: PromiseRejectionEvent): void {
        const reason = event.reason
        const message = String(reason)
        const error = reason instanceof Error ? reason : new Error(message)

        // 过滤 SDK 自身错误
        if (this.isSdkError(error)) {
            console.warn('[Sky-Monitor] SDK internal promise rejection filtered:', message)
            return
        }

        // 生成错误指纹（用于后端分析，不用于去重）
        const fingerprint = generateErrorFingerprint(error, message, 'unhandledrejection')

        const errorEvent: BrowserErrorEvent = {
            type: 'error',
            message,
            stack: reason?.stack || error.stack,
            timestamp: new Date().toISOString(),
            errorFingerprint: fingerprint,
            device: this.deviceInfo,
            network: this.networkInfo,
        }

        captureEvent(errorEvent)
    }

    /**
     * 处理资源加载错误
     *
     * 注意：去重逻辑已移至 DeduplicationIntegration（Core 层），避免重复去重
     */
    private handleResourceError(event: ErrorEvent | Event): void {
        // 只处理真正的资源加载错误
        const target = event.target as HTMLElement | null
        if (!target || target === (window as any)) {
            return
        }

        const tagName = target.tagName?.toLowerCase()
        if (!tagName || !['img', 'script', 'link', 'video', 'audio'].includes(tagName)) {
            return
        }

        // 获取资源 URL
        const url = (target as HTMLImageElement | HTMLScriptElement).src || (target as HTMLLinkElement).href || 'unknown'

        // 生成错误指纹（用于后端分析，不用于去重）
        const fingerprint = generateErrorFingerprint(url, `Resource failed: ${url}`, 'resource')

        const resourceEvent: BrowserErrorEvent = {
            type: 'error',
            message: `Failed to load ${tagName}: ${url}`,
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

    /**
     * 事件发送前处理
     * 在错误事件上附加 replayId（如果有 SessionReplay）
     */
    beforeSend(event: MonitoringEvent): MonitoringEvent | null {
        // 只处理错误类事件
        if (event.type !== 'error' && event.type !== 'exception' && event.type !== 'unhandledrejection') {
            return event
        }

        // 获取当前客户端实例
        const client = getCurrentClient()
        if (!client) {
            return event
        }

        // 获取 SessionReplayIntegration
        const replayIntegration = client.getIntegration<SessionReplayIntegration>('SessionReplay')
        if (!replayIntegration) {
            return event
        }

        // 获取当前的 replayId
        const replayId = replayIntegration.getReplayId()
        if (replayId) {
            // 附加 replayId 到错误事件
            ;(event as any).replayId = replayId
        }

        return event
    }
}
