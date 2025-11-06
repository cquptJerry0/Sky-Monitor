import { captureEvent, Integration } from '@sky-monitor/monitor-sdk-core'

import { BrowserErrorEvent } from '../types/errorTypes'
import { collectDeviceInfo, collectNetworkInfo } from '../utils/deviceInfo'
import { generateErrorFingerprint, errorDeduplicator } from '../utils/errorFingerprint'

/**
 * 资源加载错误集成配置
 */
export interface ResourceErrorIntegrationOptions {
    captureConsole?: boolean // 是否在控制台输出错误，默认 true
    enableDeduplication?: boolean // 是否启用错误去重，默认 true
    resourceTypes?: Array<'img' | 'script' | 'link' | 'video' | 'audio'> // 监听的资源类型，默认全部
}

/**
 * 资源加载错误集成
 * 专门捕获静态资源加载失败（图片、脚本、样式等）
 */
export class ResourceErrorIntegration implements Integration {
    name = 'ResourceError'
    private options: Required<ResourceErrorIntegrationOptions>
    private deviceInfo?: ReturnType<typeof collectDeviceInfo>
    private networkInfo?: ReturnType<typeof collectNetworkInfo>
    private isSetup = false
    private errorHandler?: (event: ErrorEvent | Event) => void

    constructor(options: ResourceErrorIntegrationOptions = {}) {
        this.options = {
            captureConsole: options.captureConsole !== false,
            enableDeduplication: options.enableDeduplication !== false,
            resourceTypes: options.resourceTypes || ['img', 'script', 'link', 'video', 'audio'],
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

        // 收集设备和网络信息
        this.deviceInfo = collectDeviceInfo()
        this.networkInfo = collectNetworkInfo()

        // 保存事件监听器引用
        this.errorHandler = this.handleResourceError.bind(this)

        // 注册资源加载错误监听（捕获阶段）
        window.addEventListener('error', this.errorHandler, true)
    }

    /**
     * 处理资源加载错误
     */
    private handleResourceError(event: ErrorEvent | Event): void {
        // 只处理真正的资源加载错误
        const target = event.target as HTMLElement | null
        if (!target || target === (window as any)) {
            return
        }

        const tagName = target.tagName?.toLowerCase()
        if (!tagName) {
            return
        }

        // 检查是否在监听的资源类型列表中
        if (!this.options.resourceTypes.includes(tagName as any)) {
            return
        }

        // 获取资源 URL
        const url = this.getResourceUrl(target, tagName)
        if (!url || url === 'unknown') {
            return
        }

        // 生成错误指纹
        const fingerprint = generateErrorFingerprint(url, `Resource failed: ${url}`, 'resource')

        // 错误去重检查
        if (this.options.enableDeduplication && !errorDeduplicator.shouldReport(fingerprint.hash)) {
            return
        }

        // 在控制台输出
        if (this.options.captureConsole) {
            console.error(`[Sky Monitor] Failed to load ${tagName}: ${url}`)
        }

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
     * 获取资源 URL
     */
    private getResourceUrl(target: HTMLElement, tagName: string): string {
        switch (tagName) {
            case 'img':
            case 'video':
            case 'audio':
                return (target as HTMLImageElement | HTMLVideoElement | HTMLAudioElement).src || 'unknown'
            case 'script':
                return (target as HTMLScriptElement).src || 'unknown'
            case 'link':
                return (target as HTMLLinkElement).href || 'unknown'
            default:
                return 'unknown'
        }
    }

    /**
     * 清理资源
     */
    cleanup(): void {
        if (this.errorHandler && typeof window !== 'undefined') {
            window.removeEventListener('error', this.errorHandler, true)
            this.errorHandler = undefined
        }
        this.deviceInfo = undefined
        this.networkInfo = undefined
        this.isSetup = false
    }
}
