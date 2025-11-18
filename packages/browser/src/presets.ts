import { Errors } from './tracing/errorsIntegration'
import { Metrics } from '@sky-monitor/monitor-sdk-browser-utils'
import { BreadcrumbIntegration } from './integrations/breadcrumb'
import { SessionReplayIntegration } from './integrations/sessionReplay'
import { HttpErrorIntegration } from './integrations/httpErrorIntegration'
import { ResourceErrorIntegration } from './integrations/resourceErrorIntegration'
import { PerformanceIntegration } from './tracing/performanceIntegration'
import { SessionIntegration } from './integrations/session'
import { ResourceTimingIntegration } from './integrations/resourceTiming'
import { LongTaskIntegration } from './integrations/longTask'
import { SamplingIntegration } from '@sky-monitor/monitor-sdk-core'
import { DeduplicationIntegration } from '@sky-monitor/monitor-sdk-core'
import type { Integration } from '@sky-monitor/monitor-sdk-core'

/**
 * 预设配置选项
 * 只暴露高层功能开关,内部配置写死避免冲突
 */
export interface MonitoringPresetOptions {
    dsn: string
    appId: string
    release?: string
    environment?: string

    // 功能开关
    features?: {
        captureErrors?: boolean // 捕获运行时错误,默认 true
        captureResourceErrors?: boolean // 捕获资源加载错误,默认 true
        captureHttpErrors?: boolean // 捕获HTTP错误,默认 true
        enableReplay?: boolean // 启用会话录制,默认 true
        enableMetrics?: boolean // 启用性能指标,默认 true
        enableBreadcrumbs?: boolean // 启用用户行为轨迹,默认 true
        enablePerformance?: boolean // 启用性能监控,默认 true
        enableSession?: boolean // 启用会话追踪,默认 true
        enableResourceTiming?: boolean // 启用资源性能,默认 true
        enableLongTask?: boolean // 启用长任务监控,默认 true
    }

    // 采样配置
    sampling?: {
        // 错误类事件
        errorSampleRate?: number // 错误事件采样率,默认 1.0
        exceptionSampleRate?: number // 异常事件采样率,默认继承 errorSampleRate
        unhandledrejectionSampleRate?: number // Promise 拒绝采样率,默认继承 errorSampleRate

        // 性能类事件
        performanceSampleRate?: number // 性能事件采样率,默认 0.3
        webVitalSampleRate?: number // Web Vitals 采样率,默认继承 performanceSampleRate

        // 用户行为类事件
        breadcrumbSampleRate?: number // 面包屑采样率,默认 0.1
        messageSampleRate?: number // 消息事件采样率,默认 1.0
        customSampleRate?: number // 自定义事件采样率,默认 0.5

        // 默认采样率
        defaultSampleRate?: number // 未配置事件类型的默认采样率,默认 1.0
    }

    // 传输配置
    transport?: {
        batchSize?: number // 批次大小,默认 20
        flushInterval?: number // 刷新间隔,默认 5000ms
        enableOffline?: boolean // 启用离线队列,默认 false
        offlineQueueSize?: number // 离线队列大小
        retryInterval?: number // 重试间隔
    }

    // 自定义端点路径
    endpoints?: {
        critical?: string // 关键事件端点,默认 /critical
        batch?: string // 批量事件端点,默认 /batch
        replay?: string // Replay 事件端点,默认 /replay
    }
}

/**
 * 创建监控配置
 * 内部配置写死,避免Integration冲突
 */
export function createMonitoringConfig(options: MonitoringPresetOptions) {
    const features = options.features || {}
    const sampling = options.sampling || {}
    const transport = options.transport || {}

    const integrations: Integration[] = []

    // 1. SessionReplayIntegration - 会话录制（必须在 ErrorsIntegration 之前，以便生成 replayId）
    if (features.enableReplay !== false) {
        integrations.push(
            new SessionReplayIntegration({
                mode: 'onError',
                beforeErrorDuration: 60,
                afterErrorDuration: 10,
                // 激进方案: 每 3 秒生成新快照 + 路由变化监听
                checkoutEveryNms: 3000,
                maxSegments: 20,
                maskAllInputs: true,
            })
        )
    }

    // 2. Errors Integration - 只捕获运行时错误
    if (features.captureErrors !== false) {
        integrations.push(
            new Errors({
                collectDeviceInfo: true,
                collectNetworkInfo: true,
                filterSdkErrors: true,
            })
        )
    }

    // 3. ResourceErrorIntegration - 专门捕获资源错误
    if (features.captureResourceErrors !== false) {
        integrations.push(
            new ResourceErrorIntegration({
                captureConsole: true,
                resourceTypes: ['img', 'script', 'link', 'video', 'audio'],
            })
        )
    }

    // 4. HttpErrorIntegration - 捕获HTTP错误
    if (features.captureHttpErrors !== false) {
        integrations.push(
            new HttpErrorIntegration({
                captureSuccessfulRequests: false,
                captureHeaders: true,
                captureBody: true,
            })
        )
    }

    // 5. Metrics - Core Web Vitals
    if (features.enableMetrics !== false) {
        integrations.push(new Metrics())
    }

    // 6. BreadcrumbIntegration - 用户行为轨迹
    if (features.enableBreadcrumbs !== false) {
        integrations.push(
            new BreadcrumbIntegration({
                console: true,
                dom: true,
                fetch: true,
                history: true,
                xhr: true,
            })
        )
    }

    // 7. PerformanceIntegration - 性能监控
    if (features.enablePerformance !== false) {
        integrations.push(
            new PerformanceIntegration({
                traceFetch: true,
                traceXHR: true,
                slowRequestThreshold: 3000,
                traceAllRequests: false,
            })
        )
    }

    // 8. SessionIntegration - 会话追踪
    if (features.enableSession !== false) {
        integrations.push(
            new SessionIntegration({
                sessionTimeout: 30 * 60 * 1000,
            })
        )
    }

    // 9. ResourceTimingIntegration - 资源性能
    if (features.enableResourceTiming !== false) {
        integrations.push(
            new ResourceTimingIntegration({
                enableObserver: true,
                reportAllResources: false,
                reportTiming: 'load',
            })
        )
    }

    // 10. LongTaskIntegration - 长任务监控
    if (features.enableLongTask !== false) {
        integrations.push(
            new LongTaskIntegration({
                threshold: 50,
                reportAllTasks: true,
                includeAttribution: true,
            })
        )
    }

    // 11. SamplingIntegration - 采样
    integrations.push(
        new SamplingIntegration({
            // 错误类事件
            errorSampleRate: sampling.errorSampleRate ?? 1.0,
            exceptionSampleRate: sampling.exceptionSampleRate,
            unhandledrejectionSampleRate: sampling.unhandledrejectionSampleRate,

            // 性能类事件
            performanceSampleRate: sampling.performanceSampleRate ?? 1.0,
            webVitalSampleRate: sampling.webVitalSampleRate,

            // 用户行为类事件
            breadcrumbSampleRate: sampling.breadcrumbSampleRate,
            messageSampleRate: sampling.messageSampleRate,
            customSampleRate: sampling.customSampleRate,

            // 默认采样率
            defaultSampleRate: sampling.defaultSampleRate,
        })
    )

    // 12. DeduplicationIntegration - 去重(必须放在最后)
    integrations.push(
        new DeduplicationIntegration({
            timeWindow: 60000,
            maxCacheSize: 200,
        })
    )

    return {
        dsn: options.dsn,
        appId: options.appId,
        release: options.release,
        environment: options.environment,
        integrations,
        batchSize: transport.batchSize ?? 20,
        flushInterval: transport.flushInterval ?? 5000,
        enableOffline: transport.enableOffline ?? false,
        offlineQueueSize: transport.offlineQueueSize,
        retryInterval: transport.retryInterval,
        endpoints: options.endpoints,
    }
}
