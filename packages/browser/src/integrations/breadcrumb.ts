import { addBreadcrumb, Integration } from '@sky-monitor/monitor-sdk-core'
import { getSelector } from '@sky-monitor/monitor-sdk-browser-utils'

/**
 * Breadcrumb 自动采集配置选项
 */
export interface BreadcrumbOptions {
    /** 是否捕获 Console 日志，默认 true */
    console?: boolean
    /** 是否捕获 DOM 事件（点击），默认 true */
    dom?: boolean
    /** 是否捕获 Fetch 请求，默认 true */
    fetch?: boolean
    /** 是否捕获路由变化（History API），默认 true */
    history?: boolean
    /** 是否捕获 XHR 请求，默认 true */
    xhr?: boolean
}

/**
 * Breadcrumb 自动采集集成
 *
 * 自动监听并记录用户行为轨迹，包括：
 * - 路由变化（SPA 导航）
 * - DOM 交互（点击事件）
 * - Console 日志
 * - HTTP 请求（Fetch/XHR）
 *
 * @example
 * ```typescript
 * const monitoring = await init({
 *     dsn: 'http://localhost:8080/api/v1/monitoring/xxx',
 *     integrations: [
 *         new BreadcrumbIntegration({
 *             console: true,
 *             dom: true,
 *             fetch: true,
 *             history: true,
 *             xhr: true
 *         })
 *     ]
 * })
 * ```
 */
export class BreadcrumbIntegration implements Integration {
    name = 'Breadcrumb'

    private options: Required<BreadcrumbOptions>
    private isSetup = false

    // 保存原始方法，用于恢复
    private originalFetch?: typeof window.fetch
    private originalXHROpen?: typeof XMLHttpRequest.prototype.open
    private originalXHRSend?: typeof XMLHttpRequest.prototype.send
    private originalPushState?: typeof history.pushState
    private originalReplaceState?: typeof history.replaceState
    private originalConsoleLog?: typeof console.log
    private originalConsoleWarn?: typeof console.warn
    private originalConsoleError?: typeof console.error
    private originalConsoleInfo?: typeof console.info
    private originalConsoleDebug?: typeof console.debug

    // 保存事件监听器引用，用于移除
    private popstateHandler?: () => void
    private clickHandler?: (event: Event) => void

    constructor(options: BreadcrumbOptions = {}) {
        this.options = {
            console: options.console !== false,
            dom: options.dom !== false,
            fetch: options.fetch !== false,
            history: options.history !== false,
            xhr: options.xhr !== false,
        }
    }

    /**
     * 初始化：根据配置启用各个监听器
     */
    setupOnce(): void {
        if (typeof window === 'undefined') return

        // 防止重复初始化
        if (this.isSetup) return
        this.isSetup = true

        if (this.options.history) this.instrumentHistory()
        if (this.options.dom) this.instrumentDOM()
        if (this.options.console) this.instrumentConsole()
        if (this.options.fetch) this.instrumentFetch()
        if (this.options.xhr) this.instrumentXHR()
    }

    /**
     * 监听路由变化（History API）
     *
     * 实现原理：
     * 1. 劫持 history.pushState 和 history.replaceState 方法
     * 2. 监听 popstate 事件（浏览器前进/后退）
     * 3. 记录 from URL -> to URL 的变化
     *
     * 面包屑分类：navigation
     */
    private instrumentHistory(): void {
        if (!window.history) return

        // 劫持 pushState
        this.originalPushState = history.pushState
        const originalPushState = this.originalPushState
        history.pushState = function (state: any, title: string, url?: string | URL | null) {
            const from = location.href
            // 调用原始方法
            const result = originalPushState!.apply(this, [state, title, url])
            const to = location.href

            if (from !== to) {
                addBreadcrumb({
                    category: 'navigation',
                    message: `Navigation: ${from} -> ${to}`,
                    level: 'info',
                    data: {
                        from,
                        to,
                        state,
                    },
                })
            }

            return result
        }

        // 劫持 replaceState
        this.originalReplaceState = history.replaceState
        const originalReplaceState = this.originalReplaceState
        history.replaceState = function (state: any, title: string, url?: string | URL | null) {
            const from = location.href
            const result = originalReplaceState!.apply(this, [state, title, url])
            const to = location.href

            if (from !== to) {
                addBreadcrumb({
                    category: 'navigation',
                    message: `Navigation (replace): ${from} -> ${to}`,
                    level: 'info',
                    data: {
                        from,
                        to,
                        state,
                    },
                })
            }

            return result
        }

        // 监听 popstate 事件（前进/后退）
        this.popstateHandler = () => {
            addBreadcrumb({
                category: 'navigation',
                message: `Navigation (popstate): ${location.href}`,
                level: 'info',
                data: {
                    to: location.href,
                },
            })
        }
        window.addEventListener('popstate', this.popstateHandler)
    }

    /**
     * 监听 DOM 事件（点击）
     *
     * 实现原理：
     * 1. 使用事件捕获阶段监听全局 click 事件
     * 2. 使用 getSelector 生成唯一的 CSS 选择器路径
     * 3. 提取元素文本内容（限制长度）
     *
     * 面包屑分类：ui
     */
    private instrumentDOM(): void {
        if (typeof document === 'undefined') return

        this.clickHandler = (event: Event) => {
            const target = event.target as HTMLElement
            if (!target) return

            // 生成 CSS 选择器路径
            const selector = getSelector(target)

            // 提取元素文本（限制 50 字符）
            let text = ''
            if (target.textContent) {
                text = target.textContent.trim().substring(0, 50)
                if (target.textContent.length > 50) {
                    text += '...'
                }
            }

            addBreadcrumb({
                category: 'ui',
                message: text ? `Clicked: ${selector} "${text}"` : `Clicked: ${selector}`,
                level: 'info',
                data: {
                    selector,
                    text,
                },
            })
        }

        document.addEventListener('click', this.clickHandler, true)
    }

    /**
     * 监听 Console 日志
     *
     * 实现原理：
     * 1. 保存原始 console 方法
     * 2. 重写 console.log/warn/error/info/debug
     * 3. 添加面包屑后调用原始方法，不影响正常输出
     * 4. 只记录前 3 个参数，避免过大对象
     *
     * 面包屑分类：console
     * level 映射：error -> error, warn -> warning, 其他 -> info
     */
    private instrumentConsole(): void {
        if (typeof console === 'undefined') return

        const addConsoleBreadcrumb = this.addConsoleBreadcrumb.bind(this)

        // 重写 console.log
        this.originalConsoleLog = console.log
        const originalConsoleLog = this.originalConsoleLog
        console.log = function (...args: any[]) {
            addConsoleBreadcrumb('log', args)
            originalConsoleLog!.apply(console, args)
        }

        // 重写 console.warn
        this.originalConsoleWarn = console.warn
        const originalConsoleWarn = this.originalConsoleWarn
        console.warn = function (...args: any[]) {
            addConsoleBreadcrumb('warn', args)
            originalConsoleWarn!.apply(console, args)
        }

        // 重写 console.error
        this.originalConsoleError = console.error
        const originalConsoleError = this.originalConsoleError
        console.error = function (...args: any[]) {
            addConsoleBreadcrumb('error', args)
            originalConsoleError!.apply(console, args)
        }

        // 重写 console.info
        this.originalConsoleInfo = console.info
        const originalConsoleInfo = this.originalConsoleInfo
        console.info = function (...args: any[]) {
            addConsoleBreadcrumb('info', args)
            originalConsoleInfo!.apply(console, args)
        }

        // 重写 console.debug
        this.originalConsoleDebug = console.debug
        const originalConsoleDebug = this.originalConsoleDebug
        console.debug = function (...args: any[]) {
            addConsoleBreadcrumb('debug', args)
            originalConsoleDebug!.apply(console, args)
        }
    }

    /**
     * 添加 Console 类型的面包屑
     *
     * @param method - console 方法名
     * @param args - console 参数列表
     */
    private addConsoleBreadcrumb(method: string, args: any[]): void {
        // 只记录前 3 个参数，避免过大对象
        const safeArgs = args.slice(0, 3).map(arg => {
            // 简单序列化
            if (typeof arg === 'string') return arg
            if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg)
            try {
                return JSON.stringify(arg)
            } catch {
                return '[Object]'
            }
        })

        // level 映射
        let level: 'debug' | 'info' | 'warning' | 'error' = 'info'
        if (method === 'error') level = 'error'
        else if (method === 'warn') level = 'warning'
        else if (method === 'debug') level = 'debug'

        addBreadcrumb({
            category: 'console',
            message: `console.${method}: ${safeArgs.join(' ')}`,
            level,
            data: {
                method,
                args: safeArgs,
            },
        })
    }

    /**
     * 监听 Fetch 请求
     *
     * 实现原理：
     * 1. 劫持 window.fetch 方法
     * 2. 记录请求 URL、method、status、duration
     * 3. 不记录 body，避免敏感数据泄露
     * 4. 成功和失败的请求都记录
     *
     * 面包屑分类：http
     */
    private instrumentFetch(): void {
        if (!window.fetch) return

        this.originalFetch = window.fetch
        const originalFetch = this.originalFetch

        window.fetch = function (...args: Parameters<typeof fetch>): Promise<Response> {
            const startTime = Date.now()
            const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : String(args[0])
            const options = args[1] || {}
            const method = options.method || 'GET'

            return originalFetch
                .apply(this, args)
                .then((response: Response) => {
                    const duration = Date.now() - startTime

                    addBreadcrumb({
                        category: 'http',
                        message: `Fetch: ${method} ${url} ${response.status}`,
                        level: response.ok ? 'info' : 'warning',
                        data: {
                            url,
                            method,
                            status: response.status,
                            statusText: response.statusText,
                            duration,
                        },
                    })

                    return response
                })
                .catch((error: Error) => {
                    const duration = Date.now() - startTime

                    addBreadcrumb({
                        category: 'http',
                        message: `Fetch: ${method} ${url} failed`,
                        level: 'error',
                        data: {
                            url,
                            method,
                            error: error.message,
                            duration,
                        },
                    })

                    throw error
                })
        }
    }

    /**
     * 监听 XHR 请求
     *
     * 实现原理：
     * 1. 劫持 XMLHttpRequest.prototype.open 和 send 方法
     * 2. 监听 loadend 事件获取响应
     * 3. 记录请求 URL、method、status、duration
     *
     * 面包屑分类：http
     */
    private instrumentXHR(): void {
        if (!window.XMLHttpRequest) return

        // 劫持 open 方法
        this.originalXHROpen = XMLHttpRequest.prototype.open
        const originalXHROpen = this.originalXHROpen
        XMLHttpRequest.prototype.open = function (
            method: string,
            url: string | URL,
            async?: boolean,
            username?: string | null,
            password?: string | null
        ) {
            const xhr = this as any
            xhr.__sky_breadcrumb__ = {
                method,
                url: String(url),
                startTime: Date.now(),
            }

            return originalXHROpen!.call(this, method, url, async !== false, username, password)
        }

        // 劫持 send 方法
        this.originalXHRSend = XMLHttpRequest.prototype.send
        const originalXHRSend = this.originalXHRSend
        XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
            const xhr = this as any
            const breadcrumbData = xhr.__sky_breadcrumb__

            if (!breadcrumbData) {
                return originalXHRSend!.call(this, body)
            }

            // 监听响应
            this.addEventListener('loadend', () => {
                const duration = Date.now() - breadcrumbData.startTime

                addBreadcrumb({
                    category: 'http',
                    message: `XHR: ${breadcrumbData.method} ${breadcrumbData.url} ${xhr.status}`,
                    level: xhr.status >= 200 && xhr.status < 400 ? 'info' : 'warning',
                    data: {
                        url: breadcrumbData.url,
                        method: breadcrumbData.method,
                        status: xhr.status,
                        statusText: xhr.statusText,
                        duration,
                    },
                })
            })

            return originalXHRSend!.call(this, body)
        }
    }

    /**
     * 清理资源：恢复原始方法和移除事件监听器
     */
    cleanup(): void {
        if (!this.isSetup) return

        // 恢复 History API
        if (this.originalPushState) {
            history.pushState = this.originalPushState
            this.originalPushState = undefined
        }
        if (this.originalReplaceState) {
            history.replaceState = this.originalReplaceState
            this.originalReplaceState = undefined
        }
        if (this.popstateHandler && typeof window !== 'undefined') {
            window.removeEventListener('popstate', this.popstateHandler)
            this.popstateHandler = undefined
        }

        // 恢复 DOM 监听器
        if (this.clickHandler && typeof document !== 'undefined') {
            document.removeEventListener('click', this.clickHandler, true)
            this.clickHandler = undefined
        }

        // 恢复 Console 方法
        if (this.originalConsoleLog) {
            console.log = this.originalConsoleLog
            this.originalConsoleLog = undefined
        }
        if (this.originalConsoleWarn) {
            console.warn = this.originalConsoleWarn
            this.originalConsoleWarn = undefined
        }
        if (this.originalConsoleError) {
            console.error = this.originalConsoleError
            this.originalConsoleError = undefined
        }
        if (this.originalConsoleInfo) {
            console.info = this.originalConsoleInfo
            this.originalConsoleInfo = undefined
        }
        if (this.originalConsoleDebug) {
            console.debug = this.originalConsoleDebug
            this.originalConsoleDebug = undefined
        }

        // 恢复 Fetch
        if (this.originalFetch && typeof window !== 'undefined') {
            window.fetch = this.originalFetch
            this.originalFetch = undefined
        }

        // 恢复 XHR
        if (this.originalXHROpen) {
            XMLHttpRequest.prototype.open = this.originalXHROpen
            this.originalXHROpen = undefined
        }
        if (this.originalXHRSend) {
            XMLHttpRequest.prototype.send = this.originalXHRSend
            this.originalXHRSend = undefined
        }

        this.isSetup = false
    }
}
