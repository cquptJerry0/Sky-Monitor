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
    collectDeviceInfo?: boolean // 是否收集设备信息，默认 true
    collectNetworkInfo?: boolean // 是否收集网络信息，默认 true
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

    // 递归防护: 防止 SDK 错误被重复捕获导致无限循环
    private static isCapturing = false

    constructor(options: ErrorsOptions = {}) {
        this.options = {
            collectDeviceInfo: options.collectDeviceInfo !== false,
            collectNetworkInfo: options.collectNetworkInfo !== false,
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
    }

    /**
     * 检查错误是否来自 SDK 内部
     * 通过堆栈跟踪和错误消息判断错误是否由 SDK 代码引起
     */
    private isSdkError(error: Error | string, stack?: string): boolean {
        if (!this.options.filterSdkErrors) {
            return false
        }

        // 检查错误消息
        const errorMessage = error instanceof Error ? error.message : String(error)
        const messagePatterns = [
            'HTTP error! status:', // BrowserTransport 的错误
            '[BrowserTransport]',
            '[BatchedTransport]',
            '[SessionReplayTransport]',
            'Sky-Monitor', // SDK 相关的错误
            'Failed to fetch', // fetch 失败 (可能是 SDK 上报失败)
        ]

        if (messagePatterns.some(pattern => errorMessage.includes(pattern))) {
            // 额外检查: 如果是 "Failed to fetch",需要检查堆栈是否来自 SDK
            if (errorMessage.includes('Failed to fetch')) {
                const stackTrace = typeof error === 'string' ? stack : error instanceof Error ? error.stack : stack
                if (stackTrace) {
                    // 检查堆栈中是否包含 SDK 路径
                    const sdkPathPatterns = ['/packages/browser/', '/packages/core/', '@sky-monitor/monitor-sdk']
                    if (sdkPathPatterns.some(pattern => stackTrace.includes(pattern))) {
                        return true
                    }
                }
                // 如果堆栈中没有 SDK 路径,则不过滤 (可能是用户代码的 fetch 失败)
                return false
            }
            return true
        }

        // 检查堆栈跟踪
        const stackTrace = typeof error === 'string' ? stack : error instanceof Error ? error.stack : stack

        if (!stackTrace) {
            return false
        }

        // SDK 内部文件的特征
        const sdkPatterns = [
            '@sky-monitor/monitor-sdk',
            '/monitor-sdk-',
            '/sky-monitor/',
            '/packages/browser/', // 开发环境下的 SDK 路径
            '/packages/core/', // 开发环境下的 Core 路径
            'transport/index',
            'transport/batched',
            'transport/offline',
            'transport/session-replay',
            'transport/transport-router',
            'tracing/errorsIntegration',
            'integrations/sessionReplay',
            'integrations/httpErrorIntegration',
            'BrowserTransport', // 类名
            'SessionReplayTransport', // 类名
            'BatchedTransport', // 类名
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
        // 递归防护: 防止无限循环
        if (Errors.isCapturing) {
            console.warn('[Sky-Monitor] Recursive error detected, skipping to prevent infinite loop')
            return
        }

        try {
            Errors.isCapturing = true

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
                name: 'runtime_error',
                message: fullMessage,
                lineno,
                colno,
                stack: error ? enhanceStack(error) : undefined,
                // 使用 Unix 毫秒时间戳,与 rrweb 事件时间戳格式一致
                timestamp: Date.now() as any,
                errorFingerprint: fingerprint,
                device: this.deviceInfo,
                network: this.networkInfo,
            }

            captureEvent(event)
        } finally {
            Errors.isCapturing = false
        }
    }

    /**
     * 处理未捕获的Promise拒绝
     *
     * 注意：去重逻辑已移至 DeduplicationIntegration（Core 层），避免重复去重
     */
    private handleRejection(event: PromiseRejectionEvent): void {
        // 递归防护: 防止无限循环
        if (Errors.isCapturing) {
            console.warn('[Sky-Monitor] Recursive promise rejection detected, skipping to prevent infinite loop')
            return
        }

        try {
            Errors.isCapturing = true

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
                name: 'unhandled_rejection',
                message,
                stack: reason?.stack || error.stack,
                // 使用 Unix 毫秒时间戳,与 rrweb 事件时间戳格式一致
                timestamp: Date.now() as any,
                errorFingerprint: fingerprint,
                device: this.deviceInfo,
                network: this.networkInfo,
            }

            captureEvent(errorEvent)
        } finally {
            Errors.isCapturing = false
        }
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
            console.warn('[ErrorsIntegration] No client found')
            return event
        }

        // 获取 SessionReplayIntegration
        const replayIntegration = client.getIntegration<SessionReplayIntegration>('SessionReplay')
        if (!replayIntegration) {
            console.warn('[ErrorsIntegration] No SessionReplayIntegration found')
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
