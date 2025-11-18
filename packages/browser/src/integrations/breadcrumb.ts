import { Integration, addBreadcrumb } from '@sky-monitor/monitor-sdk-core'
import { getSelector } from '@sky-monitor/monitor-sdk-browser-utils'

/**
 * Breadcrumb 自动采集配置选项
 */
export interface BreadcrumbIntegrationOptions {
    /**
     * 是否监听 Console（console.log/warn/error）
     * 默认 true
     */
    console?: boolean

    /**
     * 是否监听 DOM 事件（点击）
     * 默认 true
     */
    dom?: boolean

    /**
     * 是否监听 Fetch 请求
     * 默认 true
     */
    fetch?: boolean

    /**
     * 是否监听 History 变化（路由跳转）
     * 默认 true
     */
    history?: boolean

    /**
     * 是否监听 XMLHttpRequest
     * 默认 true
     */
    xhr?: boolean

    /**
     * 是否监听用户输入
     * 默认 false（可能涉及隐私）
     */
    input?: boolean

    /**
     * 最大面包屑数量
     * 默认 100（由 Scope 管理）
     */
    maxBreadcrumbs?: number
}

/**
 * 面包屑自动采集集成
 *
 * 功能：
 * - 自动监听并记录用户行为轨迹
 * - 支持路由变化、DOM 事件、Console 日志、HTTP 请求、用户输入
 * - 为错误提供上下文信息，帮助复现问题
 *
 * 使用场景：
 * - 错误复现：了解错误发生前用户做了什么
 * - 用户行为分析：追踪用户操作路径
 * - 调试：查看完整的操作日志
 *
 * @example
 * ```typescript
 * new BreadcrumbIntegration({
 *   console: true,    // 监听 console 日志
 *   dom: true,        // 监听点击事件
 *   fetch: true,      // 监听 Fetch 请求
 *   history: true,    // 监听路由变化
 *   xhr: true,        // 监听 XHR 请求
 *   input: false      // 不监听输入（隐私考虑）
 * })
 * ```
 */
export class BreadcrumbIntegration implements Integration {
    name = 'Breadcrumb'

    private readonly options: Required<BreadcrumbIntegrationOptions>
    private isSetup = false
    private originalConsole: {
        log?: typeof console.log
        warn?: typeof console.warn
        error?: typeof console.error
    } = {}
    private originalFetch?: typeof fetch
    private originalXHROpen?: typeof XMLHttpRequest.prototype.open
    private originalXHRSend?: typeof XMLHttpRequest.prototype.send
    private originalPushState?: typeof history.pushState
    private originalReplaceState?: typeof history.replaceState

    constructor(options: BreadcrumbIntegrationOptions = {}) {
        this.options = {
            console: options.console ?? true,
            dom: options.dom ?? true,
            fetch: options.fetch ?? true,
            history: options.history ?? true,
            xhr: options.xhr ?? true,
            input: options.input ?? false,
            maxBreadcrumbs: options.maxBreadcrumbs ?? 100,
        }
    }

    /**
     * 集成初始化
     * 根据配置启用各种监听器
     */
    setupOnce(): void {
        if (this.isSetup) {
            return
        }
        this.isSetup = true

        if (this.options.console) {
            this.instrumentConsole()
        }

        if (this.options.dom) {
            this.instrumentDOM()
        }

        if (this.options.fetch) {
            this.instrumentFetch()
        }

        if (this.options.history) {
            this.instrumentHistory()
        }

        if (this.options.xhr) {
            this.instrumentXHR()
        }

        if (this.options.input) {
            this.instrumentInput()
        }
    }

    /**
     * 监听 Console 日志
     *
     * 拦截 console.log/warn/error 方法
     * 记录日志内容到面包屑
     */
    private instrumentConsole(): void {
        const levels: Array<'log' | 'warn' | 'error'> = ['log', 'warn', 'error']

        levels.forEach(level => {
            this.originalConsole[level] = console[level]
            const original = this.originalConsole[level]

            if (!original) return

            console[level] = (...args: any[]) => {
                /**
                 * 记录 console 日志到面包屑
                 * 将参数转换为字符串
                 */
                const message = args
                    .map(arg => {
                        try {
                            return typeof arg === 'string' ? arg : JSON.stringify(arg)
                        } catch {
                            return String(arg)
                        }
                    })
                    .join(' ')

                // 只保存前3个参数
                const argsToSave = args.slice(0, 3).map(arg => {
                    try {
                        return typeof arg === 'string' ? arg : JSON.stringify(arg)
                    } catch {
                        return String(arg)
                    }
                })

                addBreadcrumb({
                    message: `console.${level}: ${message}`,
                    level: level === 'log' ? 'info' : level === 'warn' ? 'warning' : 'error',
                    category: 'console',
                    timestamp: Date.now(),
                    data: {
                        args: argsToSave,
                    },
                })

                // 调用原始方法
                original.apply(console, args)
            }
        })
    }

    /**
     * 监听 DOM 事件
     *
     * 监听全局点击事件
     * 记录点击的元素和选择器路径
     */
    private instrumentDOM(): void {
        if (typeof document === 'undefined') return

        /**
         * 使用事件捕获阶段监听点击
         * 确保能捕获所有点击事件
         */
        document.addEventListener(
            'click',
            event => {
                const target = event.target as HTMLElement

                /**
                 * 生成 DOM 选择器路径
                 * 例如：div.container>button#submit-btn
                 */
                const selector = getSelector(target, 100)

                /**
                 * 提取元素的有用信息
                 * - tagName: 标签名
                 * - id: 元素 ID
                 * - className: 类名
                 * - text: 文本内容（截取前 50 字符）
                 */
                const elementInfo: Record<string, unknown> = {
                    tag: target.tagName?.toLowerCase(),
                    selector,
                }

                if (target.id) {
                    elementInfo.id = target.id
                }

                if (target.className && typeof target.className === 'string') {
                    elementInfo.className = target.className
                }

                // 获取元素文本（去除首尾空格，最多 50 字符）
                const text = target.textContent?.trim().substring(0, 50)
                if (text) {
                    elementInfo.text = text
                }

                addBreadcrumb({
                    message: `Clicked: ${selector}`,
                    level: 'info',
                    category: 'ui',
                    timestamp: Date.now(),
                    data: elementInfo,
                })
            },
            true // 使用捕获阶段
        )
    }

    /**
     * 判断是否是 SDK 自己的请求
     * 防止记录 SDK 上报请求的面包屑,导致噪音
     */
    private isSdkRequest(url: string): boolean {
        const sdkEndpoints = ['/api/monitoring/', '/batch', '/critical', '/replay', '/session']
        return sdkEndpoints.some(endpoint => url.includes(endpoint))
    }

    /**
     * 监听 Fetch 请求
     *
     * 拦截 fetch 方法
     * 记录请求的 URL、方法、状态码、耗时
     */
    private instrumentFetch(): void {
        if (typeof window === 'undefined' || !window.fetch) return

        this.originalFetch = window.fetch
        const originalFetch = this.originalFetch
        const isSdkRequest = this.isSdkRequest.bind(this)

        window.fetch = function (...args: Parameters<typeof fetch>): Promise<Response> {
            const startTime = Date.now()
            const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : String(args[0])
            const method = (args[1]?.method || 'GET').toUpperCase()

            // 过滤 SDK 自己的请求
            if (isSdkRequest(url)) {
                return originalFetch(...args)
            }

            return originalFetch(...args)
                .then((response: Response) => {
                    const duration = Date.now() - startTime

                    /**
                     * 记录成功的 Fetch 请求
                     * 包含 URL、方法、状态码、耗时
                     */
                    addBreadcrumb({
                        message: `Fetch ${method} ${url}`,
                        level: response.ok ? 'info' : 'warning',
                        category: 'http',
                        timestamp: Date.now(),
                        data: {
                            method,
                            url,
                            status: response.status,
                            duration,
                        },
                    })

                    return response
                })
                .catch((error: Error) => {
                    const duration = Date.now() - startTime

                    /**
                     * 记录失败的 Fetch 请求
                     * 包含错误信息
                     */
                    addBreadcrumb({
                        message: `Fetch ${method} ${url} failed`,
                        level: 'error',
                        category: 'http',
                        timestamp: Date.now(),
                        data: {
                            method,
                            url,
                            error: error.message,
                            duration,
                        },
                    })

                    throw error
                })
        }
    }

    /**
     * 监听 History 变化（路由跳转）
     *
     * 拦截 pushState 和 replaceState 方法
     * 监听 popstate 事件
     * 记录 URL 变化
     */
    private instrumentHistory(): void {
        if (typeof window === 'undefined' || !window.history) return

        /**
         * 拦截 history.pushState
         * 记录新的 URL
         */
        this.originalPushState = history.pushState
        history.pushState = (...args: Parameters<typeof history.pushState>) => {
            const result = this.originalPushState!.apply(history, args)

            addBreadcrumb({
                message: `Navigation to ${location.pathname}${location.search}${location.hash}`,
                level: 'info',
                category: 'navigation',
                timestamp: Date.now(),
                data: {
                    from: document.referrer || 'direct',
                    to: location.href,
                },
            })

            return result
        }

        /**
         * 拦截 history.replaceState
         * 记录替换的 URL
         */
        this.originalReplaceState = history.replaceState
        history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
            const result = this.originalReplaceState!.apply(history, args)

            addBreadcrumb({
                message: `Navigation replaced to ${location.pathname}${location.search}${location.hash}`,
                level: 'info',
                category: 'navigation',
                timestamp: Date.now(),
                data: {
                    to: location.href,
                },
            })

            return result
        }

        /**
         * 监听 popstate 事件（浏览器后退/前进）
         * 记录 URL 变化
         */
        window.addEventListener('popstate', () => {
            addBreadcrumb({
                message: `Navigation back/forward to ${location.pathname}${location.search}${location.hash}`,
                level: 'info',
                category: 'navigation',
                timestamp: Date.now(),
                data: {
                    to: location.href,
                },
            })
        })
    }

    /**
     * 监听 XMLHttpRequest
     *
     * 拦截 XHR 的 open 和 send 方法
     * 记录请求的 URL、方法、状态码、耗时
     */
    private instrumentXHR(): void {
        if (typeof window === 'undefined' || !window.XMLHttpRequest) return

        this.originalXHROpen = XMLHttpRequest.prototype.open
        this.originalXHRSend = XMLHttpRequest.prototype.send

        const originalXHROpen = this.originalXHROpen
        const originalXHRSend = this.originalXHRSend
        const isSdkRequest = this.isSdkRequest.bind(this)

        /**
         * 拦截 open 方法
         * 保存请求信息
         */
        XMLHttpRequest.prototype.open = function (
            method: string,
            url: string | URL,
            async?: boolean,
            username?: string | null,
            password?: string | null
        ) {
            const xhr = this as any
            xhr.__breadcrumb__ = {
                method: method.toUpperCase(),
                url: String(url),
                startTime: Date.now(),
            }

            return originalXHROpen.call(this, method, url, async !== false, username, password)
        }

        /**
         * 拦截 send 方法
         * 监听请求完成，记录面包屑
         */
        XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
            const xhr = this as any
            const breadcrumbData = xhr.__breadcrumb__

            if (breadcrumbData) {
                // 过滤 SDK 自己的请求
                if (isSdkRequest(breadcrumbData.url)) {
                    return originalXHRSend.call(this, body)
                }

                /**
                 * 监听请求完成
                 * 记录请求结果
                 */
                this.addEventListener('loadend', () => {
                    const duration = Date.now() - breadcrumbData.startTime
                    const isSuccess = xhr.status >= 200 && xhr.status < 300

                    addBreadcrumb({
                        message: `XHR ${breadcrumbData.method} ${breadcrumbData.url}`,
                        level: isSuccess ? 'info' : 'warning',
                        category: 'http',
                        timestamp: Date.now(),
                        data: {
                            method: breadcrumbData.method,
                            url: breadcrumbData.url,
                            status: xhr.status,
                            duration,
                        },
                    })
                })
            }

            return originalXHRSend.call(this, body)
        }
    }

    /**
     * 监听用户输入
     *
     * 监听 input 和 change 事件
     * 记录输入字段（脱敏处理）
     *
     * 注意：
     * - 默认关闭，涉及隐私
     * - 密码字段不记录值
     * - 敏感字段（如信用卡）不记录值
     */
    private instrumentInput(): void {
        if (typeof document === 'undefined') return

        /**
         * 监听 input 事件
         * 记录输入字段的变化
         */
        document.addEventListener(
            'input',
            event => {
                const target = event.target as HTMLInputElement

                // 只处理 input 和 textarea 元素
                if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) {
                    return
                }

                const selector = getSelector(target, 100)

                /**
                 * 敏感字段检测
                 * 不记录以下字段的值：
                 * - type="password"
                 * - name 包含 password、pwd、secret
                 * - name 包含 card、cvv、ssn（信用卡、社保号等）
                 */
                const isSensitive =
                    target.type === 'password' ||
                    /password|pwd|secret|card|cvv|ssn/i.test(target.name || '') ||
                    /password|pwd|secret|card|cvv|ssn/i.test(target.id || '')

                addBreadcrumb({
                    message: `User input: ${selector}`,
                    level: 'info',
                    category: 'user',
                    timestamp: Date.now(),
                    data: {
                        tag: target.tagName.toLowerCase(),
                        type: target.type,
                        name: target.name,
                        // 敏感字段不记录值，只记录 [FILTERED]
                        value: isSensitive ? '[FILTERED]' : target.value.substring(0, 50),
                    },
                })
            },
            true // 使用捕获阶段
        )
    }

    /**
     * 清理资源
     * 恢复原始方法
     */
    cleanup(): void {
        // 恢复 console 方法
        if (this.originalConsole.log) {
            console.log = this.originalConsole.log
        }
        if (this.originalConsole.warn) {
            console.warn = this.originalConsole.warn
        }
        if (this.originalConsole.error) {
            console.error = this.originalConsole.error
        }

        // 恢复 fetch
        if (this.originalFetch) {
            window.fetch = this.originalFetch
        }

        // 恢复 XHR
        if (this.originalXHROpen) {
            XMLHttpRequest.prototype.open = this.originalXHROpen
        }
        if (this.originalXHRSend) {
            XMLHttpRequest.prototype.send = this.originalXHRSend
        }

        // 恢复 history
        if (this.originalPushState) {
            history.pushState = this.originalPushState
        }
        if (this.originalReplaceState) {
            history.replaceState = this.originalReplaceState
        }

        // 重置初始化标记
        this.isSetup = false
    }
}

/**
 * 扩展 XMLHttpRequest 类型
 * 添加自定义属性用于存储请求信息
 */
declare global {
    interface XMLHttpRequest {
        __breadcrumb__?: {
            method: string
            url: string
            startTime: number
        }
        originalXHROpen?: typeof XMLHttpRequest.prototype.open
        originalXHRSend?: typeof XMLHttpRequest.prototype.send
    }
}
