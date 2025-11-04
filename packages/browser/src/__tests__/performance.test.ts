import { describe, expect, it, beforeEach, vi } from 'vitest'

import { Monitoring } from '@sky-monitor/monitor-sdk-core'

import { PerformanceIntegration } from '../tracing/performanceIntegration'
import { BrowserTransport } from '../transport'

// Mock transport
class MockTransport extends BrowserTransport {
    sentData: Array<Record<string, unknown>> = []

    constructor() {
        super('http://test.com')
    }

    send(data: Record<string, unknown>): Promise<void> {
        this.sentData.push(data)
        return Promise.resolve()
    }
}

// Mock performance.now
let currentTime = 0
Object.defineProperty(global.performance, 'now', {
    writable: true,
    value: () => currentTime,
})

describe('PerformanceIntegration', () => {
    beforeEach(() => {
        currentTime = 0
        // 重置 fetch
        if ((global as any).originalFetch) {
            global.fetch = (global as any).originalFetch
        }
    })

    describe('Fetch 拦截', () => {
        it('应该拦截 Fetch 请求', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: async () => ({ data: 'test' }),
            }

            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            const perf = new PerformanceIntegration({ slowRequestThreshold: 100 })
            const monitoring = new Monitoring()
            const transport = new MockTransport()

            monitoring.addIntegration(perf)
            await monitoring.init(transport)

            // 模拟请求耗时 150ms
            currentTime = 0
            const promise = fetch('https://api.example.com/data')
            currentTime = 150
            await promise

            // 应该上报慢请求
            expect(transport.sentData.length).toBeGreaterThan(0)
            const perfEvent = transport.sentData.find(d => d.type === 'performance')
            expect(perfEvent).toBeDefined()
            expect(perfEvent?.url).toBe('https://api.example.com/data')
            expect(perfEvent?.method).toBe('GET')
            expect(perfEvent?.duration).toBe(150)
            expect(perfEvent?.isSlow).toBe(true)
        })

        it('应该上报失败的请求', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'))

            const perf = new PerformanceIntegration()
            const monitoring = new Monitoring()
            const transport = new MockTransport()

            monitoring.addIntegration(perf)
            await monitoring.init(transport)

            currentTime = 0
            try {
                await fetch('https://api.example.com/data')
            } catch {
                // 预期的错误，忽略
            }
            currentTime = 50

            // 应该上报错误请求
            const perfEvent = transport.sentData.find(d => d.type === 'performance')
            expect(perfEvent).toBeDefined()
            expect(perfEvent?.error).toBe('Network Error')
            expect(perfEvent?.success).toBe(false)
        })

        it('应该不上报快速成功的请求（默认配置）', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
            }

            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            const perf = new PerformanceIntegration({ slowRequestThreshold: 3000 })
            const monitoring = new Monitoring()
            const transport = new MockTransport()

            monitoring.addIntegration(perf)
            await monitoring.init(transport)

            currentTime = 0
            await fetch('https://api.example.com/data')
            currentTime = 100 // 快速请求

            // 不应该上报
            const perfEvents = transport.sentData.filter(d => d.type === 'performance')
            expect(perfEvents).toHaveLength(0)
        })

        it('应该在 traceAllRequests 为 true 时上报所有请求', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
            }

            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            const perf = new PerformanceIntegration({
                slowRequestThreshold: 3000,
                traceAllRequests: true,
            })
            const monitoring = new Monitoring()
            const transport = new MockTransport()

            monitoring.addIntegration(perf)
            await monitoring.init(transport)

            currentTime = 0
            await fetch('https://api.example.com/data')
            currentTime = 100

            // 应该上报
            const perfEvent = transport.sentData.find(d => d.type === 'performance')
            expect(perfEvent).toBeDefined()
        })
    })

    describe('XHR 拦截', () => {
        it('应该拦截 XMLHttpRequest', async () => {
            const perf = new PerformanceIntegration({ slowRequestThreshold: 100 })
            const monitoring = new Monitoring()
            const transport = new MockTransport()

            monitoring.addIntegration(perf)
            await monitoring.init(transport)

            const xhr = new XMLHttpRequest()

            return new Promise<void>(resolve => {
                xhr.addEventListener('loadend', () => {
                    // 检查是否上报
                    setTimeout(() => {
                        const perfEvent = transport.sentData.find(d => d.type === 'performance')
                        expect(perfEvent).toBeDefined()
                        expect(perfEvent?.url).toContain('example.com')
                        expect(perfEvent?.method).toBe('GET')
                        resolve()
                    }, 10)
                })

                currentTime = 0
                xhr.open('GET', 'https://api.example.com/data')
                currentTime = 150
                xhr.send()

                // 模拟响应
                setTimeout(() => {
                    Object.defineProperty(xhr, 'status', { value: 200 })
                    Object.defineProperty(xhr, 'readyState', { value: 4 })
                    xhr.dispatchEvent(new Event('loadend'))
                }, 10)
            })
        })

        it('应该捕获 XHR 错误', async () => {
            const perf = new PerformanceIntegration()
            const monitoring = new Monitoring()
            const transport = new MockTransport()

            monitoring.addIntegration(perf)
            await monitoring.init(transport)

            const xhr = new XMLHttpRequest()

            return new Promise<void>(resolve => {
                xhr.addEventListener('error', () => {
                    setTimeout(() => {
                        const perfEvent = transport.sentData.find(d => d.type === 'performance')
                        expect(perfEvent).toBeDefined()
                        expect(perfEvent?.error).toBe('Network Error')
                        resolve()
                    }, 10)
                })

                currentTime = 0
                xhr.open('GET', 'https://api.example.com/data')
                currentTime = 50
                xhr.send()

                // 模拟错误
                setTimeout(() => {
                    xhr.dispatchEvent(new Event('error'))
                }, 10)
            })
        })
    })

    describe('配置选项', () => {
        it('应该支持禁用 Fetch 拦截', async () => {
            const mockResponse = { ok: true, status: 200 }
            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            const perf = new PerformanceIntegration({
                traceFetch: false,
                slowRequestThreshold: 0,
            })
            const monitoring = new Monitoring()
            const transport = new MockTransport()

            monitoring.addIntegration(perf)
            await monitoring.init(transport)

            await fetch('https://api.example.com/data')

            // 不应该上报
            const perfEvents = transport.sentData.filter(d => d.type === 'performance')
            expect(perfEvents).toHaveLength(0)
        })

        it('应该支持自定义慢请求阈值', async () => {
            const mockResponse = { ok: true, status: 200 }
            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            const perf = new PerformanceIntegration({ slowRequestThreshold: 50 })
            const monitoring = new Monitoring()
            const transport = new MockTransport()

            monitoring.addIntegration(perf)
            await monitoring.init(transport)

            currentTime = 0
            const promise = fetch('https://api.example.com/data')
            currentTime = 60
            await promise

            const perfEvent = transport.sentData.find(d => d.type === 'performance')
            expect(perfEvent?.isSlow).toBe(true)
        })
    })
})
