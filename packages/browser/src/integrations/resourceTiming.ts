import { Integration, captureEvent, getChinaTimestamp } from '@sky-monitor/monitor-sdk-core'
import {
    collectResourceTiming,
    observeResourceTiming,
    type ResourceTimingOptions,
    type ResourceTimingData,
} from '@sky-monitor/monitor-sdk-browser-utils'

/**
 * ResourceTimingIntegration 配置选项
 */
export interface ResourceTimingIntegrationOptions {
    /**
     * 慢资源阈值（ms），默认 3000
     */
    slowThreshold?: number

    /**
     * 是否包含缓存资源，默认 true
     */
    includeCached?: boolean

    /**
     * 资源类型过滤器（只收集指定类型）
     * 如果为空，收集所有类型
     */
    typeFilter?: Array<'script' | 'stylesheet' | 'image' | 'font' | 'fetch' | 'xhr' | 'document' | 'other'>

    /**
     * URL 过滤正则（排除某些 URL）
     * 例如：排除监控SDK自身的请求
     */
    urlExcludePattern?: RegExp

    /**
     * 是否包含原始 entry 对象，默认 false
     * 设为 true 会增加数据量
     */
    includeRawEntry?: boolean
    /**
     * 是否启用实时监听（PerformanceObserver）
     * 默认 false（仅页面加载完成后收集一次）
     */
    enableObserver?: boolean

    /**
     * 是否上报所有资源
     * 默认 false（仅上报慢资源）
     */
    reportAllResources?: boolean

    /**
     * 是否上报摘要统计
     * 默认 true
     */
    reportSummary?: boolean

    /**
     * 上报时机
     * - 'load': 页面 load 事件后
     * - 'immediate': 立即收集并上报
     * 默认 'load'
     */
    reportTiming?: 'load' | 'immediate'
}

/**
 * 资源加载性能监控集成
 *
 * 功能：
 * - 收集页面资源加载性能数据（PerformanceResourceTiming）
 * - 识别慢资源（超过阈值）
 * - 分析资源加载各阶段耗时（DNS/TCP/SSL/TTFB/Download）
 * - 区分第三方资源
 * - 生成资源加载摘要统计
 *
 * 使用场景：
 * - 监控页面资源加载性能
 * - 识别性能瓶颈
 * - 优化资源加载策略
 *
 * @example
 * ```typescript
 * new ResourceTimingIntegration({
 *   slowThreshold: 3000,        // 慢资源阈值 3 秒
 *   reportAllResources: false,  // 只上报慢资源
 *   reportSummary: true,        // 上报摘要统计
 *   enableObserver: true,       // 启用实时监听（SPA）
 *   typeFilter: ['script', 'stylesheet'] // 只监控 JS 和 CSS
 * })
 * ```
 */
export class ResourceTimingIntegration implements Integration {
    name = 'ResourceTiming'

    private readonly options: Required<ResourceTimingIntegrationOptions>
    private stopObserver?: () => void
    private isSetup = false
    private loadHandler?: () => void
    private collectTimer?: number

    constructor(options: ResourceTimingIntegrationOptions = {}) {
        this.options = {
            slowThreshold: options.slowThreshold ?? 3000,
            includeCached: options.includeCached ?? true,
            typeFilter: options.typeFilter || [],
            urlExcludePattern: options.urlExcludePattern || /.^/, // 永不匹配的正则
            includeRawEntry: options.includeRawEntry ?? false,
            enableObserver: options.enableObserver ?? false,
            reportAllResources: options.reportAllResources ?? false,
            reportSummary: options.reportSummary ?? true,
            reportTiming: options.reportTiming ?? 'load',
        }
    }

    /**
     * 集成初始化
     * 根据配置决定上报时机和方式
     */
    setupOnce(): void {
        if (this.isSetup) {
            return
        }
        this.isSetup = true

        // 根据配置决定上报时机
        if (this.options.reportTiming === 'immediate') {
            this.reportResourceTiming()
        } else {
            // 等待页面加载完成
            if (document.readyState === 'complete') {
                this.reportResourceTiming()
            } else {
                this.loadHandler = () => {
                    // 延迟 1 秒，确保所有资源都已记录
                    this.collectTimer = window.setTimeout(() => this.reportResourceTiming(), 1000)
                }
                window.addEventListener('load', this.loadHandler)
            }
        }

        // 启用实时监听（适用于 SPA）
        if (this.options.enableObserver) {
            this.startObserver()
        }
    }

    /**
     * 收集并上报资源数据
     *
     * 执行流程：
     * 1. 调用 collectResourceTiming 收集资源数据
     * 2. 根据配置上报摘要统计
     * 3. 根据配置上报资源详情（全部或仅慢资源）
     */
    private reportResourceTiming(): void {
        const report = collectResourceTiming({
            slowThreshold: this.options.slowThreshold,
            includeCached: this.options.includeCached,
            typeFilter: this.options.typeFilter,
            urlExcludePattern: this.options.urlExcludePattern,
            includeRawEntry: false, // 上报时不包含原始对象，减少数据量
        })

        /**
         * 上报摘要统计
         * 包含：总资源数、慢资源数、第三方资源数、按类型分组统计等
         */
        if (this.options.reportSummary) {
            captureEvent({
                type: 'performance',
                category: 'resourceTiming',
                name: 'resource-summary',
                timestamp: getChinaTimestamp(),
                extra: {
                    summary: report.summary,
                },
            })
        }

        /**
         * 决定上报哪些资源
         * - reportAllResources = true: 上报所有资源
         * - reportAllResources = false: 仅上报慢资源
         */
        const resourcesToReport = this.options.reportAllResources ? report.resources : report.slowResources

        /**
         * 上报资源详情
         * 批量上报所有符合条件的资源
         */
        if (resourcesToReport.length > 0) {
            captureEvent({
                type: 'performance',
                category: 'resourceTiming',
                name: 'resources',
                timestamp: getChinaTimestamp(),
                extra: {
                    resources: resourcesToReport,
                    totalCount: report.resources.length,
                    slowCount: report.slowResources.length,
                },
            })
        }
    }

    /**
     * 启动实时监听
     *
     * 使用 PerformanceObserver 实时监听新资源加载
     * 适用于单页应用（SPA）动态加载资源的场景
     */
    private startObserver(): void {
        this.stopObserver = observeResourceTiming(
            (resource: ResourceTimingData) => {
                /**
                 * 根据配置决定是否上报
                 * - reportAllResources = true: 上报所有资源
                 * - reportAllResources = false: 仅上报慢资源
                 */
                const shouldReport = this.options.reportAllResources || resource.isSlow

                if (shouldReport) {
                    captureEvent({
                        type: 'performance',
                        name: 'resource_timing',
                        category: 'resourceTiming',
                        timestamp: getChinaTimestamp(),
                        extra: {
                            resource,
                        },
                    })
                }
            },
            {
                slowThreshold: this.options.slowThreshold,
                includeCached: this.options.includeCached,
                typeFilter: this.options.typeFilter,
                urlExcludePattern: this.options.urlExcludePattern,
                includeRawEntry: false,
            }
        )
    }

    /**
     * 清理资源
     * 停止性能监听，释放资源
     */
    cleanup(): void {
        if (this.stopObserver) {
            this.stopObserver()
            this.stopObserver = undefined
        }

        if (this.loadHandler) {
            window.removeEventListener('load', this.loadHandler)
            this.loadHandler = undefined
        }

        if (this.collectTimer) {
            clearTimeout(this.collectTimer)
            this.collectTimer = undefined
        }

        this.isSetup = false
    }
}
