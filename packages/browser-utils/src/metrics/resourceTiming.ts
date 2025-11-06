import type { ResourceTimingData, ResourceTimingReport, ResourceType, ResourceTimingBreakdown } from './types/resourceTiming.js'

/**
 * 资源监控配置选项
 */
export interface ResourceTimingOptions {
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
    typeFilter?: ResourceType[]

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
}

/**
 * 获取当前页面的资源加载数据
 *
 * @param options - 配置选项
 * @returns 资源监控报告
 *
 * @example
 * ```typescript
 * const report = collectResourceTiming({
 *   slowThreshold: 3000,
 *   includeCached: false,
 *   typeFilter: ['script', 'stylesheet']
 * })
 *
 * console.log(`慢资源数量: ${report.slowResources.length}`)
 * ```
 */
export function collectResourceTiming(options: ResourceTimingOptions = {}): ResourceTimingReport {
    const { slowThreshold = 3000, includeCached = true, typeFilter, urlExcludePattern, includeRawEntry = false } = options

    // 获取所有资源性能条目
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

    // 当前页面的 origin（用于判断第三方资源）
    const currentOrigin = window.location.origin

    // 初始化收集容器
    const resources: ResourceTimingData[] = []
    const slowResources: ResourceTimingData[] = []
    const countByType: Record<string, number> = {}
    let totalSize = 0
    let cachedCount = 0

    /**
     * 遍历所有资源条目并分析
     */
    for (const entry of entries) {
        // 应用 URL 排除过滤
        if (urlExcludePattern && urlExcludePattern.test(entry.name)) {
            continue
        }

        // 判断资源类型
        const type = getResourceType(entry)

        // 应用类型过滤
        if (typeFilter && !typeFilter.includes(type)) {
            continue
        }

        // 判断是否从缓存加载
        // transferSize 为 0 且 decodedBodySize > 0 表示从缓存读取
        const cached = entry.transferSize === 0 && entry.decodedBodySize > 0

        // 应用缓存过滤
        if (!includeCached && cached) {
            continue
        }

        // 计算资源加载各阶段耗时
        const breakdown = calculateBreakdown(entry)

        // 判断是否为第三方资源
        const isThirdParty = !entry.name.startsWith(currentOrigin)

        // 判断是否为慢资源
        const isSlow = entry.duration > slowThreshold

        // 构建资源数据对象
        const resourceData: ResourceTimingData = {
            url: entry.name,
            type,
            duration: Math.round(entry.duration),
            size: entry.decodedBodySize || undefined,
            transferSize: entry.transferSize || undefined,
            breakdown,
            isThirdParty,
            isSlow,
            cached,
            ...(includeRawEntry && { entry }),
        }

        resources.push(resourceData)

        // 收集慢资源
        if (isSlow) {
            slowResources.push(resourceData)
        }

        // 统计数据
        countByType[type] = (countByType[type] || 0) + 1
        totalSize += entry.transferSize || 0
        if (cached) cachedCount++
    }

    // 生成摘要统计
    const summary = {
        totalCount: resources.length,
        slowCount: slowResources.length,
        thirdPartyCount: resources.filter(r => r.isThirdParty).length,
        countByType: countByType as Record<ResourceType, number>,
        avgDuration: resources.length > 0 ? Math.round(resources.reduce((sum, r) => sum + r.duration, 0) / resources.length) : 0,
        totalSize,
        cachedCount,
    }

    return {
        resources,
        slowResources,
        summary,
        timestamp: Date.now(),
    }
}

/**
 * 根据 PerformanceResourceTiming 判断资源类型
 *
 * 判断逻辑：
 * 1. 优先根据 initiatorType 判断
 * 2. 如果无法判断，根据文件扩展名判断
 * 3. 默认返回 'other'
 *
 * @param entry - PerformanceResourceTiming 对象
 * @returns 资源类型
 */
function getResourceType(entry: PerformanceResourceTiming): ResourceType {
    const { initiatorType, name } = entry

    // 根据 initiatorType 判断
    switch (initiatorType) {
        case 'script':
            return 'script'
        case 'link':
        case 'css':
            return 'stylesheet'
        case 'img':
            return 'image'
        case 'fetch':
            return 'fetch'
        case 'xmlhttprequest':
            return 'xhr'
        case 'navigation':
            return 'document'
    }

    // 根据文件扩展名判断
    const url = name.toLowerCase()
    if (url.match(/\.(js|mjs|jsx)(\?|#|$)/)) return 'script'
    if (url.match(/\.(css)(\?|#|$)/)) return 'stylesheet'
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|avif)(\?|#|$)/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|otf|eot)(\?|#|$)/)) return 'font'

    return 'other'
}

/**
 * 计算资源加载各阶段耗时
 *
 * 时间线：
 * fetchStart -> domainLookup -> connect -> secureConnection -> request -> response -> responseEnd
 *
 * 各阶段计算：
 * - DNS: domainLookupEnd - domainLookupStart
 * - TCP: connectEnd - connectStart
 * - SSL: connectEnd - secureConnectionStart (如果有 HTTPS)
 * - TTFB: responseStart - requestStart
 * - Download: responseEnd - responseStart
 * - Total: responseEnd - fetchStart
 *
 * @param entry - PerformanceResourceTiming 对象
 * @returns 各阶段耗时分解
 */
function calculateBreakdown(entry: PerformanceResourceTiming): ResourceTimingBreakdown {
    const {
        fetchStart,
        domainLookupStart,
        domainLookupEnd,
        connectStart,
        connectEnd,
        secureConnectionStart,
        requestStart,
        responseStart,
        responseEnd,
    } = entry

    /**
     * DNS 查询时间
     * 如果资源来自同域或缓存，这些值可能为 0
     */
    const dns = domainLookupEnd > 0 && domainLookupStart > 0 ? domainLookupEnd - domainLookupStart : 0

    /**
     * TCP 连接时间
     * 如果使用了持久连接（Keep-Alive），这个值可能为 0
     */
    const tcp = connectEnd > 0 && connectStart > 0 ? connectEnd - connectStart : 0

    /**
     * SSL 握手时间
     * 仅 HTTPS 请求有此阶段
     */
    const ssl = secureConnectionStart > 0 ? connectEnd - secureConnectionStart : 0

    /**
     * TTFB（Time To First Byte）
     * 从发送请求到接收到第一个字节的时间
     * 包含网络延迟和服务器处理时间
     */
    const ttfb = responseStart > 0 && requestStart > 0 ? responseStart - requestStart : 0

    /**
     * 下载时间
     * 接收响应内容的时间
     */
    const download = responseEnd > 0 && responseStart > 0 ? responseEnd - responseStart : 0

    /**
     * 总时间
     * 从开始获取资源到完成的总耗时
     */
    const total = responseEnd - fetchStart

    return {
        dns: Math.round(dns),
        tcp: Math.round(tcp),
        ssl: Math.round(ssl),
        ttfb: Math.round(ttfb),
        download: Math.round(download),
        total: Math.round(total),
    }
}

/**
 * 持续监听新资源加载（使用 PerformanceObserver）
 *
 * 使用场景：
 * - 单页应用（SPA）动态加载资源
 * - 需要实时监控资源加载性能
 *
 * @param callback - 当有新资源加载时调用的回调函数
 * @param options - 配置选项
 * @returns 停止监听的函数
 *
 * @example
 * ```typescript
 * const stop = observeResourceTiming((resource) => {
 *   if (resource.isSlow) {
 *     console.warn('慢资源:', resource.url, resource.duration + 'ms')
 *   }
 * })
 *
 * // 停止监听
 * stop()
 * ```
 */
export function observeResourceTiming(callback: (resource: ResourceTimingData) => void, options: ResourceTimingOptions = {}): () => void {
    // 检查浏览器是否支持 PerformanceObserver
    if (!('PerformanceObserver' in window)) {
        console.warn('PerformanceObserver not supported')
        return () => {}
    }

    const { slowThreshold = 3000, includeCached = true, typeFilter, urlExcludePattern, includeRawEntry = false } = options

    /**
     * 创建性能观察器
     * 监听 'resource' 类型的性能条目
     */
    const observer = new PerformanceObserver(list => {
        const entries = list.getEntries() as PerformanceResourceTiming[]
        const currentOrigin = window.location.origin

        for (const entry of entries) {
            // 应用 URL 排除过滤
            if (urlExcludePattern?.test(entry.name)) continue

            // 判断资源类型并应用过滤
            const type = getResourceType(entry)
            if (typeFilter && !typeFilter.includes(type)) continue

            // 判断是否缓存并应用过滤
            const cached = entry.transferSize === 0 && entry.decodedBodySize > 0
            if (!includeCached && cached) continue

            // 计算各阶段耗时
            const breakdown = calculateBreakdown(entry)

            // 判断是否第三方资源
            const isThirdParty = !entry.name.startsWith(currentOrigin)

            // 判断是否慢资源
            const isSlow = entry.duration > slowThreshold

            // 触发回调
            callback({
                url: entry.name,
                type,
                duration: Math.round(entry.duration),
                size: entry.decodedBodySize || undefined,
                transferSize: entry.transferSize || undefined,
                breakdown,
                isThirdParty,
                isSlow,
                cached,
                ...(includeRawEntry && { entry }),
            })
        }
    })

    // 开始观察 resource 类型的性能条目
    observer.observe({ entryTypes: ['resource'] })

    /**
     * 返回停止监听的函数
     * 调用此函数可以断开观察器
     */
    return () => observer.disconnect()
}
