import { captureEvent, getCurrentClient, Integration } from '@sky-monitor/monitor-sdk-core'

import { BrowserErrorEvent } from '../types/errorTypes'
import { collectDeviceInfo, collectNetworkInfo } from '../utils/deviceInfo'
import { generateErrorFingerprint } from '../utils/errorFingerprint'

/**
 * 资源加载错误集成配置
 */
export interface ResourceErrorIntegrationOptions {
    captureConsole?: boolean // 是否在控制台输出错误，默认 true
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

    constructor(options: ResourceErrorIntegrationOptions = {}) {
        this.options = {
            captureConsole: options.captureConsole !== false,
            resourceTypes: options.resourceTypes || ['img', 'script', 'link', 'video', 'audio'],
        }
    }

    /**
     * 全局初始化
     */
    setupOnce(): void {
        // 收集设备和网络信息
        this.deviceInfo = collectDeviceInfo()
        this.networkInfo = collectNetworkInfo()

        // 注册资源加载错误监听（捕获阶段）
        window.addEventListener('error', this.handleResourceError.bind(this), true)
    }

    /**
     * 处理资源加载错误
     *
     * @description
     * 核心功能：
     * 1. 识别资源加载失败的类型（img、script、link 等）
     * 2. 生成错误指纹（基于资源 URL）
     * 3. 执行去重检查（避免短时间内重复上报）
     * 4. 从全局客户端获取 release 和 appId（用于 SourceMap 匹配）
     * 5. 构建完整的资源错误事件并上报
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

        // 获取全局客户端实例，提取 release 和 appId
        // 这些信息对于后端非常重要：
        // - release: 用于匹配对应版本的 SourceMap 文件
        // - appId: 用于区分不同应用的错误
        // - environment: 用于区分不同环境的资源加载问题
        const client = getCurrentClient()
        const release = (client as any)?.release
        const appId = (client as any)?.appId
        const environment = (client as any)?.environment

        const resourceEvent: BrowserErrorEvent = {
            type: 'error',
            name: 'resource_error',
            message: `Failed to load ${tagName}: ${url}`,
            timestamp: new Date().toISOString(),
            errorFingerprint: fingerprint,
            release,
            appId,
            environment,
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
}
