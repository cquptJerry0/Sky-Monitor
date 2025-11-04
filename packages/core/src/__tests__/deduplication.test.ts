import { describe, expect, it } from 'vitest'

import { Monitoring } from '../baseClient'
import { DeduplicationIntegration } from '../integrations/deduplication'
import { MonitoringEvent } from '../types'
import { MockTransport } from './helpers'

describe('DeduplicationIntegration', () => {
    it('应该对相同错误进行去重', async () => {
        const dedup = new DeduplicationIntegration({ timeWindow: 1000 })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(dedup)
        await monitoring.init(transport)

        // 连续发送相同错误
        await monitoring.captureEvent({
            type: 'error',
            message: 'test error',
            stack: 'at line 1\nat line 2',
        })
        await monitoring.captureEvent({
            type: 'error',
            message: 'test error',
            stack: 'at line 1\nat line 2',
        })
        await monitoring.captureEvent({
            type: 'error',
            message: 'test error',
            stack: 'at line 1\nat line 2',
        })

        // 只应该记录1次
        expect(transport.sentEvents).toHaveLength(1)
    })

    it('应该在时间窗口外重新记录相同错误', async () => {
        const dedup = new DeduplicationIntegration({ timeWindow: 100 })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(dedup)
        await monitoring.init(transport)

        // 第一次发送
        await monitoring.captureEvent({
            type: 'error',
            message: 'test error',
            stack: 'at line 1',
        })

        // 等待超过时间窗口
        await new Promise(resolve => setTimeout(resolve, 150))

        // 第二次发送相同错误
        await monitoring.captureEvent({
            type: 'error',
            message: 'test error',
            stack: 'at line 1',
        })

        // 应该记录2次
        expect(transport.sentEvents).toHaveLength(2)
    })

    it('应该允许不同的错误都被记录', async () => {
        const dedup = new DeduplicationIntegration({ timeWindow: 1000 })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(dedup)
        await monitoring.init(transport)

        // 发送不同的错误
        await monitoring.captureEvent({
            type: 'error',
            message: 'error 1',
            stack: 'at line 1',
        })
        await monitoring.captureEvent({
            type: 'error',
            message: 'error 2',
            stack: 'at line 2',
        })
        await monitoring.captureEvent({
            type: 'error',
            message: 'error 3',
            stack: 'at line 3',
        })

        // 都应该被记录
        expect(transport.sentEvents).toHaveLength(3)
    })

    it('应该不去重非错误类事件', async () => {
        const dedup = new DeduplicationIntegration({ timeWindow: 1000 })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(dedup)
        await monitoring.init(transport)

        // 发送相同的性能事件
        await monitoring.captureEvent({ type: 'performance', message: 'test' })
        await monitoring.captureEvent({ type: 'performance', message: 'test' })
        await monitoring.captureEvent({ type: 'performance', message: 'test' })

        // 都应该被记录（不去重）
        expect(transport.sentEvents).toHaveLength(3)
    })

    it('应该附加去重元数据', async () => {
        const dedup = new DeduplicationIntegration({ timeWindow: 1000 })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(dedup)
        await monitoring.init(transport)

        await monitoring.captureEvent({
            type: 'error',
            message: 'test error',
            stack: 'at line 1',
        })

        expect(transport.sentEvents[0]?._deduplication).toBeDefined()
        expect(transport.sentEvents[0]?._deduplication?.fingerprint).toBeTruthy()
        expect(transport.sentEvents[0]?._deduplication?.count).toBe(1)
    })

    it('应该标准化错误消息中的动态内容', async () => {
        const dedup = new DeduplicationIntegration({ timeWindow: 1000 })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(dedup)
        await monitoring.init(transport)

        // 相似的错误，只是日期不同
        await monitoring.captureEvent({
            type: 'error',
            message: 'Error on 2024-01-01',
            stack: 'at line 1',
        })
        await monitoring.captureEvent({
            type: 'error',
            message: 'Error on 2024-01-02',
            stack: 'at line 1',
        })

        // 应该被认为是同一个错误，只记录一次
        expect(transport.sentEvents).toHaveLength(1)
    })

    it('应该遵守LRU缓存容量限制', async () => {
        const dedup = new DeduplicationIntegration({
            maxCacheSize: 2,
            timeWindow: 10000,
        })
        const monitoring = new Monitoring()
        const transport = new MockTransport()

        monitoring.addIntegration(dedup)
        await monitoring.init(transport)

        // 发送3个不同的错误
        await monitoring.captureEvent({
            type: 'error',
            message: 'error 1',
            stack: 'stack 1',
        })
        await monitoring.captureEvent({
            type: 'error',
            message: 'error 2',
            stack: 'stack 2',
        })
        await monitoring.captureEvent({
            type: 'error',
            message: 'error 3',
            stack: 'stack 3',
        })

        // 再次发送第一个错误（应该已被从缓存中移除）
        await monitoring.captureEvent({
            type: 'error',
            message: 'error 1',
            stack: 'stack 1',
        })

        // 应该记录4次（缓存容量为2，第一个错误被移除后重新记录）
        expect(transport.sentEvents).toHaveLength(4)
    })
})
