import { describe, expect, it } from 'vitest'

import { EventPipeline } from '../pipeline'
import { MonitoringEvent } from '../types'

describe('EventPipeline', () => {
    it('应该正确执行单个中间件', async () => {
        const pipeline = new EventPipeline()
        const event: MonitoringEvent = { type: 'test', message: 'hello' }

        pipeline.use(e => {
            e.processed = true
            return e
        })

        const result = await pipeline.execute(event)
        expect(result).toBeTruthy()
        expect(result?.processed).toBe(true)
    })

    it('应该按顺序执行多个中间件', async () => {
        const pipeline = new EventPipeline()
        const event: MonitoringEvent = { type: 'test' }
        const order: number[] = []

        pipeline
            .use(e => {
                order.push(1)
                return e
            })
            .use(e => {
                order.push(2)
                return e
            })
            .use(e => {
                order.push(3)
                return e
            })

        await pipeline.execute(event)
        expect(order).toEqual([1, 2, 3])
    })

    it('应该支持中间件修改事件', async () => {
        const pipeline = new EventPipeline()
        const event: MonitoringEvent = { type: 'test', count: 0 }

        pipeline
            .use(e => {
                e.count = ((e.count as number) || 0) + 1
                return e
            })
            .use(e => {
                e.count = ((e.count as number) || 0) + 1
                return e
            })

        const result = await pipeline.execute(event)
        expect(result?.count).toBe(2)
    })

    it('应该支持中间件返回null丢弃事件', async () => {
        const pipeline = new EventPipeline()
        const event: MonitoringEvent = { type: 'test' }

        pipeline
            .use(() => {
                return null // 丢弃事件
            })
            .use(e => {
                // 这个中间件不应该被执行
                e.shouldNotExecute = true
                return e
            })

        const result = await pipeline.execute(event)
        expect(result).toBeNull()
    })

    it('应该支持异步中间件', async () => {
        const pipeline = new EventPipeline()
        const event: MonitoringEvent = { type: 'test' }

        pipeline.use(async e => {
            await new Promise(resolve => setTimeout(resolve, 10))
            e.async = true
            return e
        })

        const result = await pipeline.execute(event)
        expect(result?.async).toBe(true)
    })

    it('中间件返回null后应该立即停止执行', async () => {
        const pipeline = new EventPipeline()
        const event: MonitoringEvent = { type: 'test' }
        let secondExecuted = false

        pipeline
            .use(() => null)
            .use(e => {
                secondExecuted = true
                return e
            })

        const result = await pipeline.execute(event)
        expect(result).toBeNull()
        expect(secondExecuted).toBe(false)
    })
})
