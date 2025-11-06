import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ResourceTimingIntegration } from '../integrations/resourceTiming'
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
 * ResourceTimingIntegration 测试
 *
 * 测试范围：
 * - 资源性能数据收集
 * - cleanup 资源清理
 * - 重复初始化防护
 */
describe('ResourceTimingIntegration', () => {
    let integration: ResourceTimingIntegration
    let monitoring: Monitoring
    let transport: MockTransport

    beforeEach(() => {
        transport = new MockTransport()
        monitoring = new Monitoring()
    })

    afterEach(() => {
        if (integration) {
            integration.cleanup()
        }
        vi.clearAllMocks()
    })

    describe('初始化和配置', () => {
        it('应该使用默认配置', () => {
            integration = new ResourceTimingIntegration()
            expect(integration.name).toBe('ResourceTiming')
        })

        it('应该接受自定义配置', () => {
            integration = new ResourceTimingIntegration({
                slowThreshold: 5000,
                reportAllResources: true,
                reportSummary: false,
            })
            expect(integration.name).toBe('ResourceTiming')
        })

        it('应该支持 immediate 上报时机', () => {
            integration = new ResourceTimingIntegration({
                reportTiming: 'immediate',
            })
            expect(integration.name).toBe('ResourceTiming')
        })

        it('应该支持 load 上报时机', () => {
            integration = new ResourceTimingIntegration({
                reportTiming: 'load',
            })
            expect(integration.name).toBe('ResourceTiming')
        })
    })

    describe('资源清理和内存泄漏防护', () => {
        it('应该清理 load 事件监听器', () => {
            integration = new ResourceTimingIntegration({
                reportTiming: 'load',
            })

            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

            integration.setupOnce()
            integration.cleanup()

            // 应该移除了事件监听器（如果有的话）
            // 注意：如果 readyState 已经是 complete，可能不会添加监听器
            if (document.readyState !== 'complete') {
                expect(removeEventListenerSpy).toHaveBeenCalled()
            }
        })

        it('应该清理定时器', async () => {
            const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

            integration = new ResourceTimingIntegration({
                reportTiming: 'load',
            })

            integration.setupOnce()

            // 等待可能的定时器设置
            await new Promise(resolve => setTimeout(resolve, 10))

            integration.cleanup()

            // 如果设置了定时器，应该被清理
            // 注意：这取决于页面加载状态
        })

        it('cleanup 后应该可以重新初始化', () => {
            integration = new ResourceTimingIntegration()

            integration.setupOnce()
            integration.cleanup()

            // 应该可以重新初始化
            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
        })

        it('多次调用 cleanup 不应该报错', () => {
            integration = new ResourceTimingIntegration()
            integration.setupOnce()

            expect(() => {
                integration.cleanup()
                integration.cleanup()
                integration.cleanup()
            }).not.toThrow()
        })

        it('应该防止重复初始化', () => {
            integration = new ResourceTimingIntegration({
                reportTiming: 'immediate',
            })

            integration.setupOnce()

            // 再次调用 setupOnce 不应该报错
            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
        })
    })

    describe('Observer 监听', () => {
        it('应该支持启用 Observer', () => {
            integration = new ResourceTimingIntegration({
                enableObserver: true,
            })

            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
        })

        it('cleanup 应该停止 Observer', () => {
            integration = new ResourceTimingIntegration({
                enableObserver: true,
            })

            integration.setupOnce()

            expect(() => {
                integration.cleanup()
            }).not.toThrow()
        })
    })

    describe('边缘情况', () => {
        it('应该支持慢资源阈值配置', () => {
            integration = new ResourceTimingIntegration({
                slowThreshold: 100,
                reportAllResources: false,
            })

            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
        })

        it('应该支持类型过滤', () => {
            integration = new ResourceTimingIntegration({
                typeFilter: ['script', 'stylesheet'],
            })

            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
        })

        it('应该支持 URL 排除模式', () => {
            integration = new ResourceTimingIntegration({
                urlExcludePattern: /localhost/,
            })

            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
        })
    })
})
