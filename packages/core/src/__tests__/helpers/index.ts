import { Integration, MonitoringEvent } from '../../types'
import { Transport } from '../../transport'

/**
 * Mock Transport - 用于测试
 */
export class MockTransport implements Transport {
    sentEvents: MonitoringEvent[] = []

    send(data: Record<string, unknown>): void {
        this.sentEvents.push(data as MonitoringEvent)
    }

    clear(): void {
        this.sentEvents = []
    }

    getLastEvent(): MonitoringEvent | undefined {
        return this.sentEvents[this.sentEvents.length - 1]
    }

    getEventsByType(type: string): MonitoringEvent[] {
        return this.sentEvents.filter(e => e.type === type)
    }
}

/**
 * Mock Integration - 可复用的测试Integration
 */
export class MockIntegration implements Integration {
    name = 'MockIntegration'
    setupOnceCalled = 0
    initCalled = 0
    beforeSendCalled = 0

    setupOnce(): void {
        this.setupOnceCalled++
    }

    init(): void {
        this.initCalled++
    }

    beforeSend(event: MonitoringEvent): MonitoringEvent {
        this.beforeSendCalled++
        return event
    }

    reset(): void {
        this.setupOnceCalled = 0
        this.initCalled = 0
        this.beforeSendCalled = 0
    }
}

/**
 * 创建测试事件的工厂函数
 */
export function createTestEvent(override?: Partial<MonitoringEvent>): MonitoringEvent {
    return {
        type: 'test',
        timestamp: new Date().toISOString(),
        ...override,
    }
}

/**
 * 等待异步操作
 */
export async function wait(ms: number = 0): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 断言事件已发送
 */
export function assertEventSent(transport: MockTransport, type: string): MonitoringEvent {
    const found = transport.sentEvents.find(e => e.type === type)
    if (!found) {
        throw new Error(`Expected event of type "${type}" but not found`)
    }
    return found
}

/**
 * 断言事件未发送
 */
export function assertEventNotSent(transport: MockTransport, type: string): void {
    const found = transport.sentEvents.find(e => e.type === type)
    if (found) {
        throw new Error(`Expected event of type "${type}" not to be sent, but it was`)
    }
}
