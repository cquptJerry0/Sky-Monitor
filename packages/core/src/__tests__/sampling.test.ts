import { describe, expect, it } from 'vitest'

import { SamplingIntegration } from '../integrations/sampling'
import { Monitoring } from '../baseClient'
import { createTestEvent, MockTransport } from './helpers'

describe('SamplingIntegration', () => {
    describe('配置验证', () => {
        it('应该拒绝无效的errorSampleRate', () => {
            expect(() => {
                new SamplingIntegration({
                    errorSampleRate: 1.5,
                    performanceSampleRate: 0.5,
                })
            }).toThrow('errorSampleRate must be between 0 and 1')
        })

        it('应该拒绝负数的errorSampleRate', () => {
            expect(() => {
                new SamplingIntegration({
                    errorSampleRate: -0.1,
                    performanceSampleRate: 0.5,
                })
            }).toThrow('errorSampleRate must be between 0 and 1')
        })

        it('应该拒绝无效的performanceSampleRate', () => {
            expect(() => {
                new SamplingIntegration({
                    errorSampleRate: 1.0,
                    performanceSampleRate: 2.0,
                })
            }).toThrow('performanceSampleRate must be between 0 and 1')
        })

        it('应该接受有效的配置', () => {
            expect(() => {
                new SamplingIntegration({
                    errorSampleRate: 1.0,
                    performanceSampleRate: 0.3,
                })
            }).not.toThrow()
        })
    })

    describe('采样逻辑', () => {
        it('errorSampleRate为1.0时应该保留所有错误事件', () => {
            const sampling = new SamplingIntegration({
                errorSampleRate: 1.0,
                performanceSampleRate: 0,
            })

            const errorEvent = createTestEvent({ type: 'error' })
            const result = sampling.beforeSend(errorEvent)

            expect(result).toBeTruthy()
            expect(result?.type).toBe('error')
        })

        it('errorSampleRate为0时应该丢弃所有错误事件', () => {
            const sampling = new SamplingIntegration({
                errorSampleRate: 0,
                performanceSampleRate: 1.0,
            })

            const errorEvent = createTestEvent({ type: 'error' })
            const result = sampling.beforeSend(errorEvent)

            expect(result).toBeNull()
        })

        it('performanceSampleRate为0时应该丢弃所有性能事件', () => {
            const sampling = new SamplingIntegration({
                errorSampleRate: 1.0,
                performanceSampleRate: 0,
            })

            const perfEvent = createTestEvent({ type: 'webVital' })
            const result = sampling.beforeSend(perfEvent)

            expect(result).toBeNull()
        })

        it('应该正确识别错误事件类型', () => {
            const sampling = new SamplingIntegration({
                errorSampleRate: 1.0,
                performanceSampleRate: 0,
            })

            // 错误事件应该使用 errorSampleRate
            const errorEvent = createTestEvent({ type: 'error' })
            const result = sampling.beforeSend(errorEvent)
            expect(result).toBeTruthy()
            expect(result?._sampling?.rate).toBe(1.0)
        })

        it('应该正确识别不同类型的性能事件', () => {
            const sampling = new SamplingIntegration({
                errorSampleRate: 0,
                performanceSampleRate: 1.0,
            })

            const perfTypes = ['webVital', 'performance']

            perfTypes.forEach(type => {
                const event = createTestEvent({ type })
                const result = sampling.beforeSend(event)
                expect(result).toBeTruthy()
            })
        })
    })

    describe('采样元数据', () => {
        it('应该在采样的事件上添加_sampling元数据', () => {
            const sampling = new SamplingIntegration({
                errorSampleRate: 1.0,
                performanceSampleRate: 1.0,
            })

            const event = createTestEvent({ type: 'error' })
            const result = sampling.beforeSend(event)

            expect(result?._sampling).toBeDefined()
            expect(result?._sampling.rate).toBe(1.0)
            expect(result?._sampling.sampled).toBe(true)
            expect(result?._sampling.timestamp).toBeGreaterThan(0)
        })

        it('性能事件应该记录正确的采样率', () => {
            const sampling = new SamplingIntegration({
                errorSampleRate: 1.0,
                performanceSampleRate: 0.3,
            })

            const event = createTestEvent({ type: 'webVital' })
            const result = sampling.beforeSend(event)

            if (result) {
                expect(result._sampling.rate).toBe(0.3)
            }
        })
    })

    describe('与Pipeline集成', () => {
        it('应该在Pipeline中正常工作', async () => {
            const monitoring = new Monitoring()
            const transport = new MockTransport()

            monitoring.addIntegration(
                new SamplingIntegration({
                    errorSampleRate: 1.0,
                    performanceSampleRate: 0,
                })
            )

            await monitoring.init(transport)

            // 发送错误事件（应该通过）
            await monitoring.captureEvent(createTestEvent({ type: 'error' }))
            expect(transport.sentEvents).toHaveLength(1)

            // 发送性能事件（应该被丢弃）
            await monitoring.captureEvent(createTestEvent({ type: 'webVital' }))
            expect(transport.sentEvents).toHaveLength(1) // 仍然是1个
        })

        it('应该与其他Integration协同工作', async () => {
            const monitoring = new Monitoring()
            const transport = new MockTransport()

            // 先添加一个修改事件的Integration
            monitoring.addIntegration({
                name: 'TestModifier',
                beforeSend: event => {
                    event.modified = true
                    return event
                },
            })

            // 再添加采样
            monitoring.addIntegration(
                new SamplingIntegration({
                    errorSampleRate: 1.0,
                    performanceSampleRate: 1.0,
                })
            )

            await monitoring.init(transport)

            await monitoring.captureEvent(createTestEvent({ type: 'error' }))

            expect(transport.sentEvents).toHaveLength(1)
            expect(transport.sentEvents[0]?.modified).toBe(true)
            expect(transport.sentEvents[0]?._sampling).toBeDefined()
        })
    })
})
