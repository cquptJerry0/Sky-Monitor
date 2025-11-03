import { describe, expect, it, vi } from 'vitest'

import { Monitoring } from '../baseClient'
import { Integration, MonitoringEvent } from '../types'
import { createTestEvent, MockIntegration, MockTransport } from './helpers'

// 采样Integration（测试用）
class SamplingIntegration implements Integration {
    name = 'SamplingIntegration'

    beforeSend(event: MonitoringEvent): MonitoringEvent | null {
        // 丢弃type为test的事件
        if (event.type === 'test') {
            return null
        }
        return event
    }
}

describe('Integration Lifecycle', () => {
    it('应该正确调用setupOnce', () => {
        const integration = new MockIntegration()
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(integration)
        monitoring.init(transport)

        expect(integration.setupOnceCalled).toBe(1)
    })

    it('应该正确调用init', () => {
        const integration = new MockIntegration()
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(integration)
        monitoring.init(transport)

        expect(integration.initCalled).toBe(1)
    })

    it('setupOnce应该只执行一次', () => {
        const integration = new MockIntegration()
        const setupOnceSpy = vi.fn()
        integration.setupOnce = setupOnceSpy

        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(integration)
        monitoring.init(transport)
        monitoring.init(transport) // 第二次调用

        expect(setupOnceSpy).toHaveBeenCalledTimes(1)
    })

    it('应该正确执行beforeSend钩子', async () => {
        const integration = new MockIntegration()
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(integration)
        monitoring.init(transport)

        await monitoring.captureEvent(createTestEvent({ message: 'hello' }))

        expect(transport.sentEvents).toHaveLength(1)
        expect(integration.beforeSendCalled).toBe(1)
    })

    it('beforeSend返回null应该丢弃事件', async () => {
        const sampling = new SamplingIntegration()
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(sampling)
        monitoring.init(transport)

        // 这个应该被丢弃
        await monitoring.captureEvent(createTestEvent({ message: 'should be dropped' }))
        expect(transport.sentEvents).toHaveLength(0)

        // 这个应该通过
        await monitoring.captureEvent(createTestEvent({ type: 'error', message: 'should pass' }))
        expect(transport.sentEvents).toHaveLength(1)
    })

    it('应该支持多个Integration协同工作', async () => {
        const integration1 = new MockIntegration()
        const integration2: Integration = {
            name: 'Integration2',
            beforeSend: (event: MonitoringEvent) => {
                event.count = ((event.count as number) || 0) + 1
                return event
            },
        }

        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(integration1).addIntegration(integration2)
        monitoring.init(transport)

        await monitoring.captureEvent(createTestEvent({ count: 0 }))

        expect(transport.sentEvents).toHaveLength(1)
        expect(integration1.beforeSendCalled).toBe(1)
        expect(transport.sentEvents[0]?.count).toBe(1)
    })

    it('链式添加Integration应该正常工作', () => {
        const int1 = new MockIntegration()
        const int2 = new MockIntegration()
        const monitoring = new Monitoring()

        const result = monitoring.addIntegration(int1).addIntegration(int2)

        expect(result).toBe(monitoring)
    })
})
