/**
 * 资源类型枚举
 */
export type ResourceType = 'script' | 'stylesheet' | 'image' | 'font' | 'fetch' | 'xhr' | 'document' | 'other'

/**
 * 资源加载各阶段耗时分解
 */
export interface ResourceTimingBreakdown {
    /**
     * DNS 查询耗时（ms）
     */
    dns: number

    /**
     * TCP 连接耗时（ms）
     */
    tcp: number

    /**
     * SSL 握手耗时（ms）
     */
    ssl: number

    /**
     * 等待首字节耗时 TTFB（ms）
     * 从请求开始到接收到第一个字节的时间
     */
    ttfb: number

    /**
     * 内容下载耗时（ms）
     */
    download: number

    /**
     * 总耗时（ms）
     * = responseEnd - startTime
     */
    total: number
}

/**
 * 单个资源的完整数据
 */
export interface ResourceTimingData {
    /**
     * 资源 URL
     */
    url: string

    /**
     * 资源类型
     */
    type: ResourceType

    /**
     * 总耗时（ms）
     */
    duration: number

    /**
     * 资源大小（字节）
     * 注意：某些资源可能无法获取大小（跨域、缓存）
     */
    size?: number

    /**
     * 传输大小（字节，实际网络传输）
     * 如果为 0，表示来自缓存
     */
    transferSize?: number

    /**
     * 各阶段耗时分解
     */
    breakdown: ResourceTimingBreakdown

    /**
     * 是否为第三方资源（跨域）
     */
    isThirdParty: boolean

    /**
     * 是否为慢资源（超过阈值）
     */
    isSlow: boolean

    /**
     * 是否从缓存加载
     */
    cached: boolean

    /**
     * 原始 PerformanceResourceTiming 对象（可选）
     * 用于高级调试
     */
    entry?: PerformanceResourceTiming
}

/**
 * 资源摘要统计
 */
export interface ResourceTimingSummary {
    /**
     * 总资源数量
     */
    totalCount: number

    /**
     * 慢资源数量
     */
    slowCount: number

    /**
     * 第三方资源数量
     */
    thirdPartyCount: number

    /**
     * 按类型分组的数量
     */
    countByType: Record<ResourceType, number>

    /**
     * 平均加载时间（ms）
     */
    avgDuration: number

    /**
     * 总传输大小（字节）
     */
    totalSize: number

    /**
     * 从缓存加载的资源数量
     */
    cachedCount: number
}

/**
 * 完整的资源监控报告
 */
export interface ResourceTimingReport {
    /**
     * 所有资源列表
     */
    resources: ResourceTimingData[]

    /**
     * 慢资源列表（单独提取，方便告警）
     */
    slowResources: ResourceTimingData[]

    /**
     * 统计摘要
     */
    summary: ResourceTimingSummary

    /**
     * 采集时间戳
     */
    timestamp: number
}
