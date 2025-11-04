import { describe, expect, it, beforeEach, vi } from 'vitest'

import { Transport } from '@sky-monitor/monitor-sdk-core'

import { OfflineTransport } from '../transport/offline'

// Mock localStorage
const localStorageMock = (() => {
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

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
})

// Mock navigator.onLine
Object.defineProperty(global.navigator, 'onLine', {
    writable: true,
    value: true,
})

class MockTransport implements Transport {
    sentData: Array<Record<string, unknown>> = []
    shouldFail = false

    send(data: Record<string, unknown>): void {
        if (this.shouldFail) {
            throw new Error('Network error')
        }
        this.sentData.push(data)
    }
}

describe('OfflineTransport', () => {
    beforeEach(() => {
        localStorageMock.clear()
        ;(global.navigator as any).onLine = true
    })

    it('应该在在线时直接发送数据', () => {
        const mockTransport = new MockTransport()
        const offline = new OfflineTransport(mockTransport, {
            storageKey: 'test-offline',
        })

        offline.send({ type: 'test', message: 'hello' })

        expect(mockTransport.sentData).toHaveLength(1)
        expect(mockTransport.sentData[0]).toEqual({ type: 'test', message: 'hello' })
    })

    it('应该在离线时保存数据到LocalStorage', () => {
        const mockTransport = new MockTransport()
        const offline = new OfflineTransport(mockTransport, {
            storageKey: 'test-offline',
        })

        // 模拟离线
        ;(global.navigator as any).onLine = false

        offline.send({ type: 'test', message: 'offline' })

        // 不应该发送
        expect(mockTransport.sentData).toHaveLength(0)

        // 应该保存到 localStorage
        const stored = localStorageMock.getItem('test-offline')
        expect(stored).toBeTruthy()

        const queue = JSON.parse(stored!)
        expect(queue).toHaveLength(1)
        expect(queue[0].data).toEqual({ type: 'test', message: 'offline' })
    })

    it('应该在网络失败时保存数据到LocalStorage', () => {
        const mockTransport = new MockTransport()
        mockTransport.shouldFail = true

        const offline = new OfflineTransport(mockTransport, {
            storageKey: 'test-offline',
        })

        offline.send({ type: 'test', message: 'will fail' })

        // 应该保存到 localStorage
        const stored = localStorageMock.getItem('test-offline')
        expect(stored).toBeTruthy()

        const queue = JSON.parse(stored!)
        expect(queue).toHaveLength(1)
    })

    it('应该遵守最大队列大小限制', () => {
        const mockTransport = new MockTransport()
        const offline = new OfflineTransport(mockTransport, {
            storageKey: 'test-offline',
            maxQueueSize: 3,
        })

        // 模拟离线
        ;(global.navigator as any).onLine = false

        // 发送4个事件
        offline.send({ type: 'test', id: 1 })
        offline.send({ type: 'test', id: 2 })
        offline.send({ type: 'test', id: 3 })
        offline.send({ type: 'test', id: 4 })

        const stored = localStorageMock.getItem('test-offline')
        const queue = JSON.parse(stored!)

        // 应该只保留最新的3个
        expect(queue).toHaveLength(3)
        expect(queue[0].data.id).toBe(2)
        expect(queue[1].data.id).toBe(3)
        expect(queue[2].data.id).toBe(4)
    })

    it('应该在重试后清空队列', () => {
        const mockTransport = new MockTransport()
        mockTransport.shouldFail = true

        const offline = new OfflineTransport(mockTransport, {
            storageKey: 'test-offline',
        })

        // 发送失败的数据
        offline.send({ type: 'test', message: 'will fail' })

        expect(localStorageMock.getItem('test-offline')).toBeTruthy()

        // 恢复网络
        mockTransport.shouldFail = false

        // 触发重试
        offline.flush()

        // localStorage 应该被清空
        expect(localStorageMock.getItem('test-offline')).toBeNull()

        // 数据应该被发送
        expect(mockTransport.sentData).toHaveLength(1)
    })

    it('应该在重试失败3次后丢弃事件', () => {
        const mockTransport = new MockTransport()
        mockTransport.shouldFail = true

        const offline = new OfflineTransport(mockTransport, {
            storageKey: 'test-offline',
        })

        // 发送失败的数据
        offline.send({ type: 'test', message: 'will always fail' })

        // 重试3次
        offline.flush()
        offline.flush()
        offline.flush()

        // 第4次应该被丢弃
        offline.flush()

        // localStorage 应该被清空（因为重试次数超过3次）
        expect(localStorageMock.getItem('test-offline')).toBeNull()
    })

    it('应该处理多个队列项', () => {
        const mockTransport = new MockTransport()
        const offline = new OfflineTransport(mockTransport, {
            storageKey: 'test-offline',
        })

        // 模拟离线
        ;(global.navigator as any).onLine = false

        // 发送多个事件
        offline.send({ type: 'test', id: 1 })
        offline.send({ type: 'test', id: 2 })
        offline.send({ type: 'test', id: 3 })

        // 恢复在线
        ;(global.navigator as any).onLine = true

        // 触发重试
        offline.flush()

        // 所有事件都应该被发送
        expect(mockTransport.sentData).toHaveLength(3)
        expect(mockTransport.sentData[0]).toMatchObject({ type: 'test', id: 1 })
        expect(mockTransport.sentData[1]).toMatchObject({ type: 'test', id: 2 })
        expect(mockTransport.sentData[2]).toMatchObject({ type: 'test', id: 3 })
    })
})
