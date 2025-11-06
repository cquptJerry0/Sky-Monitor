import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

import { Monitoring } from '@sky-monitor/monitor-sdk-core'

import { BreadcrumbIntegration } from '../integrations/breadcrumb'
import { BrowserTransport } from '../transport'

// Mock transport
class MockTransport extends BrowserTransport {
    sentEvents: any[] = []

    constructor() {
        super('http://test.com')
    }

    send(data: Record<string, unknown>): Promise<void> {
        this.sentEvents.push(data)
        return Promise.resolve()
    }
}

// Mock DOM 环境
const mockWindow = global.window as any
const mockDocument = global.document as any

describe('BreadcrumbIntegration', () => {
    let originalFetch: typeof fetch
    let originalXHROpen: typeof XMLHttpRequest.prototype.open
    let originalXHRSend: typeof XMLHttpRequest.prototype.send
    let originalPushState: typeof history.pushState
    let originalReplaceState: typeof history.replaceState
    let originalConsoleLog: typeof console.log
    let originalConsoleWarn: typeof console.warn
    let originalConsoleError: typeof console.error

    beforeEach(() => {
        // 保存原始方法
        originalFetch = global.fetch
        originalXHROpen = XMLHttpRequest.prototype.open
        originalXHRSend = XMLHttpRequest.prototype.send
        originalPushState = history.pushState
        originalReplaceState = history.replaceState
        originalConsoleLog = console.log
        originalConsoleWarn = console.warn
        originalConsoleError = console.error
    })

    afterEach(() => {
        // 恢复原始方法
        global.fetch = originalFetch
        XMLHttpRequest.prototype.open = originalXHROpen
        XMLHttpRequest.prototype.send = originalXHRSend
        history.pushState = originalPushState
        history.replaceState = originalReplaceState
        console.log = originalConsoleLog
        console.warn = originalConsoleWarn
        console.error = originalConsoleError
    })

    it('应该正确初始化并启用所有选项', () => {
        const breadcrumb = new BreadcrumbIntegration({
            console: true,
            dom: true,
            fetch: true,
            history: true,
            xhr: true,
        })

        expect(breadcrumb.name).toBe('Breadcrumb')

        // 调用 setupOnce 不应该抛出错误
        expect(() => breadcrumb.setupOnce()).not.toThrow()
    })

    it('应该支持禁用特定功能', () => {
        const breadcrumb = new BreadcrumbIntegration({
            console: false,
            dom: false,
            fetch: false,
            history: false,
            xhr: false,
        })

        // 调用 setupOnce 不应该抛出错误
        expect(() => breadcrumb.setupOnce()).not.toThrow()

        // console 方法不应该被修改
        expect(console.log).toBe(originalConsoleLog)
    })

    it('应该捕获 console.log 日志', async () => {
        const breadcrumb = new BreadcrumbIntegration({ console: true })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(breadcrumb)
        await monitoring.init(transport)

        // 触发 console.log
        console.log('Test message', 123)

        // 捕获一个事件以获取面包屑
        await monitoring.captureEvent({ type: 'error', message: 'test error' })

        const event = transport.sentEvents[0]
        expect(event?.breadcrumbs).toBeDefined()

        const consoleBreadcrumb = event?.breadcrumbs?.find((b: any) => b.category === 'console')
        expect(consoleBreadcrumb).toBeDefined()
        expect(consoleBreadcrumb?.message).toContain('console.log')
        expect(consoleBreadcrumb?.message).toContain('Test message')
    })

    it('应该捕获 console.error 并设置正确的 level', async () => {
        const breadcrumb = new BreadcrumbIntegration({ console: true })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(breadcrumb)
        await monitoring.init(transport)

        // 触发 console.error
        console.error('Error message')

        // 捕获一个事件以获取面包屑
        await monitoring.captureEvent({ type: 'error', message: 'test error' })

        const event = transport.sentEvents[0]
        const consoleBreadcrumb = event?.breadcrumbs?.find((b: any) => b.category === 'console' && b.message.includes('Error message'))
        expect(consoleBreadcrumb).toBeDefined()
        expect(consoleBreadcrumb?.level).toBe('error')
    })

    it('应该捕获 console.warn 并设置正确的 level', async () => {
        const breadcrumb = new BreadcrumbIntegration({ console: true })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(breadcrumb)
        await monitoring.init(transport)

        // 触发 console.warn
        console.warn('Warning message')

        // 捕获一个事件以获取面包屑
        await monitoring.captureEvent({ type: 'error', message: 'test error' })

        const event = transport.sentEvents[0]
        const consoleBreadcrumb = event?.breadcrumbs?.find((b: any) => b.category === 'console' && b.message.includes('Warning message'))
        expect(consoleBreadcrumb).toBeDefined()
        expect(consoleBreadcrumb?.level).toBe('warning')
    })

    it('应该只记录前3个 console 参数', async () => {
        const breadcrumb = new BreadcrumbIntegration({ console: true })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(breadcrumb)
        await monitoring.init(transport)

        // 触发 console.log with 多个参数
        console.log('arg1', 'arg2', 'arg3', 'arg4', 'arg5')

        // 捕获一个事件以获取面包屑
        await monitoring.captureEvent({ type: 'error', message: 'test error' })

        const event = transport.sentEvents[0]
        const consoleBreadcrumb = event?.breadcrumbs?.find((b: any) => b.category === 'console')

        expect(consoleBreadcrumb?.data?.args).toBeDefined()
        expect(consoleBreadcrumb?.data?.args).toHaveLength(3)
    })

    it('应该捕获 DOM 点击事件', async () => {
        const breadcrumb = new BreadcrumbIntegration({ dom: true })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(breadcrumb)
        await monitoring.init(transport)

        // 创建并触发点击事件
        const button = document.createElement('button')
        button.id = 'test-button'
        button.textContent = 'Click Me'
        document.body.appendChild(button)

        const clickEvent = new MouseEvent('click', { bubbles: true })
        button.dispatchEvent(clickEvent)

        // 捕获一个事件以获取面包屑
        await monitoring.captureEvent({ type: 'error', message: 'test error' })

        const event = transport.sentEvents[0]
        const domBreadcrumb = event?.breadcrumbs?.find((b: any) => b.category === 'ui')

        expect(domBreadcrumb).toBeDefined()
        expect(domBreadcrumb?.message).toContain('Clicked')
        expect(domBreadcrumb?.data?.selector).toBeDefined()

        // 清理
        document.body.removeChild(button)
    })

    it('应该捕获 history.pushState', async () => {
        const breadcrumb = new BreadcrumbIntegration({ history: true })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(breadcrumb)
        await monitoring.init(transport)

        // 触发 pushState
        const currentUrl = window.location.href
        history.pushState({}, '', '/new-page')

        // 捕获一个事件以获取面包屑
        await monitoring.captureEvent({ type: 'error', message: 'test error' })

        const event = transport.sentEvents[0]
        const navigationBreadcrumb = event?.breadcrumbs?.find((b: any) => b.category === 'navigation')

        expect(navigationBreadcrumb).toBeDefined()
        expect(navigationBreadcrumb?.message).toContain('Navigation')
        expect(navigationBreadcrumb?.data?.from).toBeDefined()
        expect(navigationBreadcrumb?.data?.to).toBeDefined()

        // 恢复 URL
        history.pushState({}, '', currentUrl)
    })

    it('应该捕获 Fetch 请求', async () => {
        // Mock fetch BEFORE integration setup
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
        })

        const breadcrumb = new BreadcrumbIntegration({ fetch: true })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(breadcrumb)
        await monitoring.init(transport)

        // 发送请求
        await fetch('/api/test', { method: 'GET' })

        // 捕获一个事件以获取面包屑
        await monitoring.captureEvent({ type: 'error', message: 'test error' })

        const event = transport.sentEvents[0]
        const httpBreadcrumb = event?.breadcrumbs?.find((b: any) => b.category === 'http' && b.message.includes('Fetch'))

        expect(httpBreadcrumb).toBeDefined()
        expect(httpBreadcrumb?.data?.url).toContain('/api/test')
        expect(httpBreadcrumb?.data?.method).toBe('GET')
        expect(httpBreadcrumb?.data?.status).toBe(200)
    })

    it('应该为失败的 Fetch 请求设置 warning level', async () => {
        // Mock fetch BEFORE integration setup
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
        })

        const breadcrumb = new BreadcrumbIntegration({ fetch: true })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(breadcrumb)
        await monitoring.init(transport)

        // 发送请求
        await fetch('/api/not-found')

        // 捕获一个事件以获取面包屑
        await monitoring.captureEvent({ type: 'error', message: 'test error' })

        const event = transport.sentEvents[0]
        const httpBreadcrumb = event?.breadcrumbs?.find((b: any) => b.category === 'http' && b.data?.status === 404)

        expect(httpBreadcrumb).toBeDefined()
        expect(httpBreadcrumb?.level).toBe('warning')
    })

    it('应该捕获 Fetch 网络错误', async () => {
        // Mock fetch BEFORE integration setup
        const networkError = new Error('Network error')
        global.fetch = vi.fn().mockRejectedValue(networkError)

        const breadcrumb = new BreadcrumbIntegration({ fetch: true })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(breadcrumb)
        await monitoring.init(transport)

        // 发送请求（应该失败）
        try {
            await fetch('/api/test')
        } catch (e) {
            // 预期会失败
        }

        // 捕获一个事件以获取面包屑
        await monitoring.captureEvent({ type: 'error', message: 'test error' })

        const event = transport.sentEvents[0]
        const httpBreadcrumb = event?.breadcrumbs?.find((b: any) => b.category === 'http' && b.message.includes('failed'))

        expect(httpBreadcrumb).toBeDefined()
        expect(httpBreadcrumb?.level).toBe('error')
        expect(httpBreadcrumb?.data?.error).toContain('Network error')
    })

    it('应该不影响原始 console 方法的功能', () => {
        const consoleSpy = vi.spyOn(console, 'log')

        const breadcrumb = new BreadcrumbIntegration({ console: true })
        breadcrumb.setupOnce()

        console.log('Test message')

        // 原始方法应该被调用
        expect(consoleSpy).toHaveBeenCalledWith('Test message')
    })

    it('应该限制面包屑文本长度', async () => {
        const breadcrumb = new BreadcrumbIntegration({ dom: true })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(breadcrumb)
        await monitoring.init(transport)

        // 创建一个带有长文本的按钮
        const button = document.createElement('button')
        button.textContent = 'A'.repeat(100) // 100 个字符
        document.body.appendChild(button)

        const clickEvent = new MouseEvent('click', { bubbles: true })
        button.dispatchEvent(clickEvent)

        // 捕获一个事件以获取面包屑
        await monitoring.captureEvent({ type: 'error', message: 'test error' })

        const event = transport.sentEvents[0]
        const domBreadcrumb = event?.breadcrumbs?.find((b: any) => b.category === 'ui')

        // 文本应该被截断
        expect(domBreadcrumb?.data?.text?.length).toBeLessThanOrEqual(53) // 50 + '...'

        // 清理
        document.body.removeChild(button)
    })

    it('应该捕获 XHR 请求', async () => {
        const breadcrumb = new BreadcrumbIntegration({ xhr: true })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(breadcrumb)
        await monitoring.init(transport)

        // 创建 XHR 请求
        const xhr = new XMLHttpRequest()
        xhr.open('GET', '/api/test')
        xhr.send()

        // 模拟响应
        Object.defineProperty(xhr, 'status', { writable: true, value: 200 })
        Object.defineProperty(xhr, 'statusText', { writable: true, value: 'OK' })
        xhr.dispatchEvent(new Event('loadend'))

        // 捕获一个事件以获取面包屑
        await monitoring.captureEvent({ type: 'error', message: 'test error' })

        const event = transport.sentEvents[0]
        const httpBreadcrumb = event?.breadcrumbs?.find((b: any) => b.category === 'http' && b.message.includes('XHR'))

        expect(httpBreadcrumb).toBeDefined()
        expect(httpBreadcrumb?.data?.url).toContain('/api/test')
        expect(httpBreadcrumb?.data?.method).toBe('GET')
        expect(httpBreadcrumb?.data?.status).toBe(200)
    })

    it('应该为失败的 XHR 请求设置 warning level', async () => {
        const breadcrumb = new BreadcrumbIntegration({ xhr: true })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(breadcrumb)
        await monitoring.init(transport)

        // 创建 XHR 请求
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/error')
        xhr.send()

        // 模拟错误响应
        Object.defineProperty(xhr, 'status', { writable: true, value: 500 })
        Object.defineProperty(xhr, 'statusText', { writable: true, value: 'Internal Server Error' })
        xhr.dispatchEvent(new Event('loadend'))

        // 捕获一个事件以获取面包屑
        await monitoring.captureEvent({ type: 'error', message: 'test error' })

        const event = transport.sentEvents[0]
        const httpBreadcrumb = event?.breadcrumbs?.find((b: any) => b.category === 'http' && b.data?.status === 500)

        expect(httpBreadcrumb).toBeDefined()
        expect(httpBreadcrumb?.level).toBe('warning')
    })

    it('应该正确清理所有资源', () => {
        const breadcrumb = new BreadcrumbIntegration({
            console: true,
            dom: true,
            fetch: true,
            history: true,
            xhr: true,
        })

        breadcrumb.setupOnce()

        // 方法应该被劫持
        expect(console.log).not.toBe(originalConsoleLog)
        expect(history.pushState).not.toBe(originalPushState)
        expect(window.fetch).not.toBe(originalFetch)
        expect(XMLHttpRequest.prototype.open).not.toBe(originalXHROpen)

        // 调用 cleanup
        breadcrumb.cleanup()

        // 方法应该被恢复
        expect(console.log).toBe(originalConsoleLog)
        expect(history.pushState).toBe(originalPushState)
        expect(window.fetch).toBe(originalFetch)
        expect(XMLHttpRequest.prototype.open).toBe(originalXHROpen)
    })

    it('应该防止重复初始化', () => {
        const breadcrumb = new BreadcrumbIntegration({ console: true })

        breadcrumb.setupOnce()
        const firstConsoleLog = console.log

        // 再次调用 setupOnce
        breadcrumb.setupOnce()

        // console.log 应该还是同一个引用，说明没有重复劫持
        expect(console.log).toBe(firstConsoleLog)
    })

    it('cleanup 后可以重新初始化', () => {
        const breadcrumb = new BreadcrumbIntegration({ console: true })

        breadcrumb.setupOnce()
        breadcrumb.cleanup()

        // 应该恢复为原始方法
        expect(console.log).toBe(originalConsoleLog)

        // 重新初始化
        breadcrumb.setupOnce()

        // 应该再次被劫持
        expect(console.log).not.toBe(originalConsoleLog)

        // 清理
        breadcrumb.cleanup()
    })
})
