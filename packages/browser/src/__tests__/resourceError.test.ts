import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ResourceErrorIntegration } from '../integrations/resourceErrorIntegration'
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
 * ResourceErrorIntegration 测试
 *
 * 测试范围：
 * - 资源加载错误捕获
 * - 错误去重
 * - cleanup 资源清理
 * - 重复初始化防护
 */
describe('ResourceErrorIntegration', () => {
    let integration: ResourceErrorIntegration
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
            integration = new ResourceErrorIntegration()
            expect(integration.name).toBe('ResourceError')
        })

        it('应该接受自定义配置', () => {
            integration = new ResourceErrorIntegration({
                captureConsole: false,
                enableDeduplication: false,
                resourceTypes: ['img', 'script'],
            })
            expect(integration.name).toBe('ResourceError')
        })
    })

    describe('资源加载错误捕获', () => {
        it('应该捕获图片加载失败', async () => {
            integration = new ResourceErrorIntegration()
            monitoring.addIntegration(integration)
            await monitoring.init(transport)

            // 创建失败的图片加载
            const img = document.createElement('img')
            img.src = 'https://nonexistent.example.com/image.png'
            document.body.appendChild(img)

            // 触发 error 事件
            const errorEvent = new Event('error')
            Object.defineProperty(errorEvent, 'target', { value: img, enumerable: true })
            img.dispatchEvent(errorEvent)

            // 等待异步处理
            await new Promise(resolve => setTimeout(resolve, 10))

            // 应该捕获到错误事件
            expect(transport.sentEvents.length).toBeGreaterThan(0)

            // 清理
            document.body.removeChild(img)
        })

        it('应该捕获脚本加载失败', async () => {
            integration = new ResourceErrorIntegration()
            monitoring.addIntegration(integration)
            await monitoring.init(transport)

            // 创建失败的脚本加载
            const script = document.createElement('script')
            script.src = 'https://nonexistent.example.com/script.js'
            document.body.appendChild(script)

            // 触发 error 事件
            const errorEvent = new Event('error')
            Object.defineProperty(errorEvent, 'target', { value: script, enumerable: true })
            script.dispatchEvent(errorEvent)

            // 等待异步处理
            await new Promise(resolve => setTimeout(resolve, 10))

            // 应该捕获到错误事件
            expect(transport.sentEvents.length).toBeGreaterThan(0)

            // 清理
            document.body.removeChild(script)
        })
    })

    describe('资源清理和内存泄漏防护', () => {
        it('应该移除 error 事件监听器', () => {
            integration = new ResourceErrorIntegration()

            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

            integration.setupOnce()
            integration.cleanup()

            expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function), true)
        })

        it('cleanup 后应该可以重新初始化', () => {
            integration = new ResourceErrorIntegration()

            integration.setupOnce()
            integration.cleanup()

            // 应该可以重新初始化
            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
        })

        it('多次调用 cleanup 不应该报错', () => {
            integration = new ResourceErrorIntegration()
            integration.setupOnce()

            expect(() => {
                integration.cleanup()
                integration.cleanup()
                integration.cleanup()
            }).not.toThrow()
        })

        it('应该防止重复初始化', () => {
            integration = new ResourceErrorIntegration()

            const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

            integration.setupOnce()
            addEventListenerSpy.mockClear()

            // 再次调用 setupOnce
            integration.setupOnce()

            // addEventListener 不应该被再次调用
            expect(addEventListenerSpy).not.toHaveBeenCalled()
        })
    })

    describe('边缘情况', () => {
        it('应该忽略非资源错误', async () => {
            integration = new ResourceErrorIntegration({
                resourceTypes: ['img'],
            })
            monitoring.addIntegration(integration)
            await monitoring.init(transport)

            // 触发非图片资源错误
            const script = document.createElement('script')
            const errorEvent = new Event('error')
            Object.defineProperty(errorEvent, 'target', { value: script, enumerable: true })
            window.dispatchEvent(errorEvent)

            // 等待异步处理
            await new Promise(resolve => setTimeout(resolve, 10))

            // 不应该捕获（因为配置中只监听 img）
            expect(transport.sentEvents.length).toBe(0)
        })
    })
})
