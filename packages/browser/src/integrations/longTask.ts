import { Integration, captureEvent, getChinaTimestamp } from '@sky-monitor/monitor-sdk-core'

/**
 * 长任务监控集成配置
 */
export interface LongTaskIntegrationOptions {
    /**
     * 长任务阈值（ms），默认 50ms
     * 注意: PerformanceObserver 的 longtask 类型默认阈值是 50ms
     */
    threshold?: number

    /**
     * 是否上报所有长任务，默认 true
     */
    reportAllTasks?: boolean

    /**
     * 是否包含归因信息（attribution），默认 true
     */
    includeAttribution?: boolean
}

/**
 * 长任务数据
 */
export interface LongTaskData {
    /**
     * 任务名称
     */
    name: string

    /**
     * 任务类型
     */
    entryType: string

    /**
     * 开始时间
     */
    startTime: number

    /**
     * 持续时间（ms）
     */
    duration: number

    /**
     * 归因信息（如果可用）
     */
    attribution?: {
        name: string
        entryType: string
        startTime: number
        duration: number
        containerType?: string
        containerSrc?: string
        containerId?: string
        containerName?: string
    }[]
}

/**
 * 长任务监控集成
 *
 * 功能：
 * - 使用 PerformanceObserver 监听长任务（longtask）
 * - 识别阻塞主线程的任务（默认 > 50ms）
 * - 收集任务归因信息（哪个脚本/iframe 导致的）
 * - 帮助定位性能瓶颈
 *
 * 使用场景：
 * - 监控页面卡顿
 * - 识别阻塞主线程的代码
 * - 优化用户交互响应时间
 *
 * @example
 * ```typescript
 * new LongTaskIntegration({
 *   threshold: 50,              // 长任务阈值 50ms
 *   reportAllTasks: true,       // 上报所有长任务
 *   includeAttribution: true    // 包含归因信息
 * })
 * ```
 */
export class LongTaskIntegration implements Integration {
    name = 'LongTask'

    private options: Required<LongTaskIntegrationOptions>
    private observer: PerformanceObserver | null = null
    private isSetup = false

    constructor(options: LongTaskIntegrationOptions = {}) {
        this.options = {
            threshold: options.threshold ?? 50,
            reportAllTasks: options.reportAllTasks ?? true,
            includeAttribution: options.includeAttribution ?? true,
        }
    }

    /**
     * 集成初始化
     */
    setupOnce(): void {
        if (this.isSetup) {
            return
        }
        this.isSetup = true

        // 检查浏览器是否支持 longtask
        if (typeof PerformanceObserver === 'undefined') {
            return
        }

        if (!PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
            return
        }

        this.startObserver()
    }

    /**
     * 启动 PerformanceObserver 监听长任务
     */
    private startObserver(): void {
        try {
            this.observer = new PerformanceObserver(list => {
                for (const entry of list.getEntries()) {
                    this.handleLongTask(entry as PerformanceLongTaskTiming)
                }
            })

            this.observer.observe({ entryTypes: ['longtask'] })
        } catch (error) {
            // 浏览器不支持或其他错误，静默失败
        }
    }

    /**
     * 处理长任务条目
     */
    private handleLongTask(entry: PerformanceLongTaskTiming): void {
        // 检查是否达到阈值
        if (entry.duration < this.options.threshold) {
            return
        }

        // 构建长任务数据
        const taskData: LongTaskData = {
            name: entry.name,
            entryType: entry.entryType,
            startTime: entry.startTime,
            duration: entry.duration,
        }

        // 添加归因信息
        if (this.options.includeAttribution && entry.attribution) {
            taskData.attribution = Array.from(entry.attribution).map(attr => ({
                name: attr.name,
                entryType: attr.entryType,
                startTime: attr.startTime,
                duration: attr.duration,
                containerType: (attr as any).containerType,
                containerSrc: (attr as any).containerSrc,
                containerId: (attr as any).containerId,
                containerName: (attr as any).containerName,
            }))
        }

        // 上报长任务事件
        if (this.options.reportAllTasks) {
            captureEvent({
                type: 'performance',
                name: 'long_task',
                category: 'longTask',
                timestamp: getChinaTimestamp(),
                extra: {
                    task: taskData,
                },
            })
        }
    }

    /**
     * 清理资源
     */
    cleanup(): void {
        if (this.observer) {
            this.observer.disconnect()
            this.observer = null
        }
        this.isSetup = false
    }
}

/**
 * PerformanceLongTaskTiming 类型定义
 */
interface PerformanceLongTaskTiming extends PerformanceEntry {
    attribution: PerformanceEntry[]
}
