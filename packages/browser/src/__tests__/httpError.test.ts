import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { HttpErrorIntegration } from '../integrations/httpErrorIntegration'
import { Monitoring } from '@sky-monitor/monitor-sdk-core'
import type { Transport, MonitoringEvent } from '@sky-monitor/monitor-sdk-core'

/**
 * Mock Transport
 */
class MockTransport implements Transport {
    sentEvents: MonitoringEvent[] = []

    async send(event: MonitoringEvent): Promise<void> {
        this.sentEvents.push(event)
    }
}

/**
 * HttpErrorIntegration 测试
 *
 * 测试范围：
 * - HTTP 请求错误捕获
 * - cleanup 资源清理
 * - 重复初始化防护
 */
describe('HttpErrorIntegration', () => {
    let integration: HttpErrorIntegration
    let monitoring: Monitoring
    let transport: MockTransport
    let originalFetch: typeof fetch

    beforeEach(() => {
        transport = new MockTransport()
        monitoring = new Monitoring()
        originalFetch = global.fetch
    })

    afterEach(() => {
        if (integration) {
            integration.cleanup()
        }
        global.fetch = originalFetch
        vi.clearAllMocks()
    })

    describe('初始化和配置', () => {
        it('应该使用默认配置', () => {
            integration = new HttpErrorIntegration()
            expect(integration.name).toBe('HttpError')
        })

        it('应该接受自定义配置', () => {
            integration = new HttpErrorIntegration({
                captureFetch: false,
                captureXHR: true,
                captureConsole: false,
            })
            expect(integration.name).toBe('HttpError')
        })
    })

    describe('资源清理和内存泄漏防护', () => {
        it('应该恢复 Fetch 方法', () => {
            integration = new HttpErrorIntegration()
            monitoring.addIntegration(integration)

            const initialFetch = window.fetch

            integration.setupOnce()
            const hijackedFetch = window.fetch

            integration.cleanup()
            const restoredFetch = window.fetch

            // setupOnce 应该劫持 fetch
            expect(hijackedFetch).not.toBe(initialFetch)
            // cleanup 应该恢复原始 fetch
            expect(restoredFetch).toBe(initialFetch)
        })

        it('应该恢复 XHR 方法', () => {
            integration = new HttpErrorIntegration()

            const originalOpen = XMLHttpRequest.prototype.open
            const originalSend = XMLHttpRequest.prototype.send
            const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader

            integration.setupOnce()
            integration.cleanup()

            // 应该恢复原始方法
            expect(XMLHttpRequest.prototype.open).toBe(originalOpen)
            expect(XMLHttpRequest.prototype.send).toBe(originalSend)
            expect(XMLHttpRequest.prototype.setRequestHeader).toBe(originalSetRequestHeader)
        })

        it('cleanup 后应该可以重新初始化', () => {
            integration = new HttpErrorIntegration()

            integration.setupOnce()
            integration.cleanup()

            // 应该可以重新初始化
            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
        })

        it('多次调用 cleanup 不应该报错', () => {
            integration = new HttpErrorIntegration()
            integration.setupOnce()

            expect(() => {
                integration.cleanup()
                integration.cleanup()
                integration.cleanup()
            }).not.toThrow()
        })

        it('应该防止重复初始化', () => {
            integration = new HttpErrorIntegration()

            const initialFetch = window.fetch

            integration.setupOnce()
            const firstHijackedFetch = window.fetch

            // 再次调用 setupOnce
            integration.setupOnce()
            const secondFetch = window.fetch

            // fetch 应该还是同一个引用，说明没有重复劫持
            expect(secondFetch).toBe(firstHijackedFetch)
        })
    })

    describe('Fetch 拦截', () => {
        it('应该拦截 Fetch 请求', async () => {
            // Mock fetch
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
            })
            global.fetch = mockFetch

            integration = new HttpErrorIntegration()
            monitoring.addIntegration(integration)
            await monitoring.init(transport)

            // 发起请求
            await fetch('/api/test')

            // 等待异步处理
            await new Promise(resolve => setTimeout(resolve, 10))

            // 应该拦截到请求（但可能不会上报，因为请求成功）
            expect(mockFetch).toHaveBeenCalled()
        })

        it('应该捕获 Fetch 错误', async () => {
            // Mock fetch 失败
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

            integration = new HttpErrorIntegration()
            monitoring.addIntegration(integration)
            await monitoring.init(transport)

            // 发起请求
            try {
                await fetch('/api/test')
            } catch (e) {
                // 预期会抛出错误
            }

            // 等待异步处理
            await new Promise(resolve => setTimeout(resolve, 10))

            // 应该捕获到错误事件
            expect(transport.sentEvents.length).toBeGreaterThan(0)
        })

        it('应该捕获 HTTP 错误状态码', async () => {
            // Mock fetch 返回错误状态码
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
            })

            integration = new HttpErrorIntegration()
            monitoring.addIntegration(integration)
            await monitoring.init(transport)

            // 发起请求
            await fetch('/api/notfound')

            // 等待异步处理
            await new Promise(resolve => setTimeout(resolve, 10))

            // 应该捕获到错误事件
            expect(transport.sentEvents.length).toBeGreaterThan(0)
        })
    })

    describe('边缘情况', () => {
        it('应该支持只监听 Fetch', () => {
            integration = new HttpErrorIntegration({
                captureFetch: true,
                captureXHR: false,
            })

            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
        })

        it('应该支持只监听 XHR', () => {
            integration = new HttpErrorIntegration({
                captureFetch: false,
                captureXHR: true,
            })

            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
        })
    })
})
