import { describe, expect, it, beforeEach } from 'vitest'

import { Monitoring, MonitoringEvent } from '@sky-monitor/monitor-sdk-core'

import { SessionIntegration } from '../integrations/session'
import { BrowserTransport } from '../transport'

// Mock transport
class MockTransport extends BrowserTransport {
    sentEvents: MonitoringEvent[] = []

    constructor() {
        super('http://test.com')
    }

    send(data: Record<string, unknown>): Promise<void> {
        this.sentEvents.push(data as MonitoringEvent)
        return Promise.resolve()
    }
}

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store: Record<string, string> = {}

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value
        },
        removeItem: (key: string) => {
            delete store[key]
        },
        clear: () => {
            store = {}
        },
    }
})()

Object.defineProperty(global, 'sessionStorage', {
    value: sessionStorageMock,
})

describe('SessionIntegration', () => {
    beforeEach(() => {
        sessionStorageMock.clear()
    })

    it('应该为每个事件附加会话ID', async () => {
        const session = new SessionIntegration({ storageKey: 'test-session' })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(session)
        await monitoring.init(transport)

        await monitoring.captureEvent({ type: 'error', message: 'test' })

        expect(transport.sentEvents[0]?.sessionId).toBeTruthy()
        expect(typeof transport.sentEvents[0]?.sessionId).toBe('string')
    })

    it('应该为相同会话的事件使用相同的会话ID', async () => {
        const session = new SessionIntegration({ storageKey: 'test-session' })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(session)
        await monitoring.init(transport)

        await monitoring.captureEvent({ type: 'error', message: 'test 1' })
        await monitoring.captureEvent({ type: 'error', message: 'test 2' })

        const sessionId1 = transport.sentEvents[0]?.sessionId
        const sessionId2 = transport.sentEvents[1]?.sessionId

        expect(sessionId1).toBe(sessionId2)
    })

    it('应该附加会话元数据', async () => {
        const session = new SessionIntegration({ storageKey: 'test-session' })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(session)
        await monitoring.init(transport)

        await monitoring.captureEvent({ type: 'error', message: 'test' })

        const event = transport.sentEvents[0]
        expect(event?._session).toBeDefined()
        expect(event?._session?.startTime).toBeTruthy()
        expect(event?._session?.duration).toBeGreaterThanOrEqual(0)
        expect(event?._session?.eventCount).toBe(1)
        expect(event?._session?.errorCount).toBe(1)
        expect(event?._session?.pageViews).toBe(1)
    })

    it('应该正确统计事件数', async () => {
        const session = new SessionIntegration({ storageKey: 'test-session' })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(session)
        await monitoring.init(transport)

        await monitoring.captureEvent({ type: 'error', message: 'test 1' })
        await monitoring.captureEvent({ type: 'error', message: 'test 2' })
        await monitoring.captureEvent({ type: 'performance', name: 'test 3', value: 100 })

        expect(transport.sentEvents[0]?._session?.eventCount).toBe(1)
        expect(transport.sentEvents[1]?._session?.eventCount).toBe(2)
        expect(transport.sentEvents[2]?._session?.eventCount).toBe(3)
    })

    it('应该正确统计错误数', async () => {
        const session = new SessionIntegration({ storageKey: 'test-session' })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(session)
        await monitoring.init(transport)

        await monitoring.captureEvent({ type: 'error', message: 'error 1' })
        await monitoring.captureEvent({ type: 'performance', name: 'perf', value: 100 })
        await monitoring.captureEvent({ type: 'error', message: 'error 2' })
        await monitoring.captureEvent({ type: 'error', message: 'error 3' })

        expect(transport.sentEvents[0]?._session?.errorCount).toBe(1)
        expect(transport.sentEvents[1]?._session?.errorCount).toBe(1) // 性能事件不增加
        expect(transport.sentEvents[2]?._session?.errorCount).toBe(2)
        expect(transport.sentEvents[3]?._session?.errorCount).toBe(3)
    })

    it('应该在超时后创建新会话', async () => {
        const session = new SessionIntegration({
            storageKey: 'test-session',
            sessionTimeout: 100, // 100ms 超时
        })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(session)
        await monitoring.init(transport)

        await monitoring.captureEvent({ type: 'error', message: 'test 1' })

        const sessionId1 = transport.sentEvents[0]?.sessionId

        // 等待超时
        await new Promise(resolve => setTimeout(resolve, 150))

        await monitoring.captureEvent({ type: 'error', message: 'test 2' })

        const sessionId2 = transport.sentEvents[1]?.sessionId

        // 应该是不同的会话
        expect(sessionId1).not.toBe(sessionId2)

        // 新会话的事件计数应该重置
        expect(transport.sentEvents[1]?._session?.eventCount).toBe(1)
        expect(transport.sentEvents[1]?._session?.errorCount).toBe(1)
    })

    it('应该从 sessionStorage 恢复会话', async () => {
        // 先创建一个会话
        const session1 = new SessionIntegration({ storageKey: 'test-session' })
        const monitoring1 = new Monitoring()
        const transport1 = new MockTransport()

        monitoring1.addIntegration(session1)
        monitoring1.init(transport1)

        await monitoring1.captureEvent({ type: 'error', message: 'test 1' })

        const originalSessionId = transport1.sentEvents[0]?.sessionId

        // 创建新的实例（模拟页面刷新）
        const session2 = new SessionIntegration({ storageKey: 'test-session' })
        const monitoring2 = new Monitoring()
        const transport2 = new MockTransport()

        monitoring2.addIntegration(session2)
        monitoring2.init(transport2)

        await monitoring2.captureEvent({ type: 'error', message: 'test 2' })

        const restoredSessionId = transport2.sentEvents[0]?.sessionId

        // 应该恢复相同的会话ID
        expect(restoredSessionId).toBe(originalSessionId)

        // 页面浏览数应该增加
        expect(transport2.sentEvents[0]?._session?.pageViews).toBe(2)
    })

    it('应该计算正确的会话持续时间', async () => {
        const session = new SessionIntegration({ storageKey: 'test-session' })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(session)
        await monitoring.init(transport)

        await monitoring.captureEvent({ type: 'error', message: 'test 1' })

        // 等待一段时间
        await new Promise(resolve => setTimeout(resolve, 100))

        await monitoring.captureEvent({ type: 'error', message: 'test 2' })

        const duration = transport.sentEvents[1]?._session?.duration ?? 0

        // 持续时间应该至少 100ms
        expect(duration).toBeGreaterThanOrEqual(100)
    })
})
