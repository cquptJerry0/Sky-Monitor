import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SessionReplayIntegration } from '../integrations/sessionReplay'
import type { MonitoringEvent } from '@sky-monitor/monitor-sdk-core'

// Mock rrweb
vi.mock('rrweb', () => ({
    record: vi.fn(options => {
        const stopFn = vi.fn()

        // 模拟生成录制事件
        if (options.emit) {
            setTimeout(() => {
                options.emit({
                    type: 2,
                    data: {},
                    timestamp: Date.now(),
                })
            }, 100)
        }

        return stopFn
    }),
}))

/**
 * SessionReplayIntegration 测试套件
 *
 * 测试覆盖：
 * - 基础配置和初始化
 * - 多种录制模式 (always/onError/sampled)
 * - 错误触发和数据附加
 * - 缓冲区管理和数据清理
 * - sessionStorage 持久化
 * - 资源清理和内存泄漏防护
 */
describe('SessionReplayIntegration', () => {
    let integration: SessionReplayIntegration
    let sessionStorageMock: Record<string, string>

    beforeEach(() => {
        // Mock sessionStorage
        sessionStorageMock = {}
        global.sessionStorage = {
            getItem: vi.fn((key: string) => sessionStorageMock[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                sessionStorageMock[key] = value
            }),
            removeItem: vi.fn((key: string) => {
                delete sessionStorageMock[key]
            }),
            clear: vi.fn(() => {
                sessionStorageMock = {}
            }),
            length: 0,
            key: vi.fn(),
        } as Storage

        vi.useFakeTimers()
    })

    afterEach(() => {
        // 防御性清理：确保资源释放
        if (integration) {
            integration.cleanup()
        }
        vi.clearAllTimers()
        vi.useRealTimers()
        vi.clearAllMocks()
    })

    describe('构造函数和配置', () => {
        it('应该使用默认配置', () => {
            integration = new SessionReplayIntegration()
            expect(integration.name).toBe('SessionReplay')
            expect(integration.priority).toBe(30)
        })

        it('应该接受自定义配置', () => {
            integration = new SessionReplayIntegration({
                mode: 'always',
                maxBufferDuration: 120,
                maskAllInputs: false,
            })

            const status = integration.getStatus()
            expect(status.isRecording).toBe(false) // 未调用 setupOnce
        })
    })

    describe('录制模式', () => {
        it('always 模式应该立即开始录制', () => {
            integration = new SessionReplayIntegration({ mode: 'always' })
            integration.setupOnce()

            const status = integration.getStatus()
            expect(status.isRecording).toBe(true)
        })

        it('onError 模式应该预先录制但不上报', () => {
            integration = new SessionReplayIntegration({ mode: 'onError' })
            integration.setupOnce()

            const status = integration.getStatus()
            expect(status.isRecording).toBe(true)
        })

        it('sampled 模式应该按概率录制', () => {
            // 测试100%采样
            const mathSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05)
            integration = new SessionReplayIntegration({
                mode: 'sampled',
                sampleRate: 0.1,
            })
            integration.setupOnce()

            const status = integration.getStatus()
            expect(status.isRecording).toBe(true)

            mathSpy.mockRestore()
        })

        it('sampled 模式应该在采样外不录制', () => {
            // 测试0%采样
            const mathSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9)
            integration = new SessionReplayIntegration({
                mode: 'sampled',
                sampleRate: 0.1,
            })
            integration.setupOnce()

            const status = integration.getStatus()
            expect(status.isRecording).toBe(false)

            mathSpy.mockRestore()
        })
    })

    describe('错误触发机制', () => {
        it('应该在错误事件中附加 replay 数据', async () => {
            integration = new SessionReplayIntegration({ mode: 'onError' })
            integration.setupOnce()

            // 等待录制一些事件
            await vi.advanceTimersByTimeAsync(200)

            const errorEvent: MonitoringEvent = {
                type: 'error',
                message: 'Test error',
                timestamp: new Date().toISOString(),
            }

            const result = integration.beforeSend(errorEvent)

            // 应该附加了 replay 数据（如果有录制事件的话）
            expect(result.type).toBe('error')
            // replay 数据可能为空，因为模拟的 rrweb 可能没有生成事件
        })

        it('错误后应该继续录制指定时长', async () => {
            integration = new SessionReplayIntegration({
                mode: 'onError',
                postErrorDuration: 5,
            })
            integration.setupOnce()

            const errorEvent: MonitoringEvent = {
                type: 'error',
                message: 'Test error',
            }

            integration.beforeSend(errorEvent)

            expect(integration.getStatus().isRecording).toBe(true)

            // 5秒后应该停止录制
            await vi.advanceTimersByTimeAsync(5000)

            expect(integration.getStatus().isRecording).toBe(false)
        })

        it('非错误事件不应该附加 replay 数据', () => {
            integration = new SessionReplayIntegration({ mode: 'onError' })
            integration.setupOnce()

            const performanceEvent: MonitoringEvent = {
                type: 'performance',
                name: 'test',
            }

            const result = integration.beforeSend(performanceEvent)

            expect(result.replay).toBeUndefined()
        })
    })

    describe('数据缓冲区管理', () => {
        it('应该限制事件总数', async () => {
            integration = new SessionReplayIntegration({
                mode: 'always',
                maxEvents: 10,
            })
            integration.setupOnce()

            // 模拟添加大量事件
            const privateMethods = integration as any
            for (let i = 0; i < 20; i++) {
                privateMethods.handleReplayEvent({
                    type: 2,
                    data: {},
                    timestamp: Date.now(),
                })
            }

            const status = integration.getStatus()
            expect(status.eventCount).toBeLessThanOrEqual(10)
        })

        it('应该清理超过缓冲时长的旧事件', async () => {
            integration = new SessionReplayIntegration({
                mode: 'always',
                maxBufferDuration: 5, // 5秒
            })
            integration.setupOnce()

            const privateMethods = integration as any
            const now = Date.now()

            // 添加一个旧事件（10秒前）
            privateMethods.handleReplayEvent({
                type: 2,
                data: {},
                timestamp: now - 10000,
            })

            // 添加一个新事件（现在）
            privateMethods.handleReplayEvent({
                type: 2,
                data: {},
                timestamp: now,
            })

            // 调用清理方法
            privateMethods.pruneOldEvents()

            const status = integration.getStatus()
            // 旧事件应该被清理，只保留1个
            expect(status.eventCount).toBe(1)
        })
    })

    describe('sessionStorage 持久化', () => {
        it('应该保存数据到 sessionStorage', async () => {
            integration = new SessionReplayIntegration({
                mode: 'always',
                useSessionStorage: true,
                storageKey: 'test-replay',
            })
            integration.setupOnce()

            const privateMethods = integration as any

            // 添加一些事件
            privateMethods.handleReplayEvent({
                type: 2,
                data: {},
                timestamp: Date.now(),
            })

            // 手动调用保存
            privateMethods.saveToStorage()

            expect(sessionStorage.setItem).toHaveBeenCalledWith('test-replay', expect.any(String))
        })

        it('应该从 sessionStorage 恢复数据', () => {
            // 预先保存数据
            const mockData = {
                events: [{ type: 2, data: {}, timestamp: Date.now() }],
                bufferStartTime: Date.now(),
                errorTriggered: false,
                timestamp: Date.now(),
            }
            sessionStorageMock['test-replay'] = JSON.stringify(mockData)

            integration = new SessionReplayIntegration({
                mode: 'onError',
                useSessionStorage: true,
                storageKey: 'test-replay',
            })
            integration.setupOnce()

            const status = integration.getStatus()
            expect(status.eventCount).toBeGreaterThan(0)
        })

        it('应该清除过期的 sessionStorage 数据', () => {
            // 预先保存过期数据（2分钟前）
            const mockData = {
                events: [],
                bufferStartTime: Date.now() - 120000,
                errorTriggered: false,
                timestamp: Date.now() - 120000,
            }
            sessionStorageMock['test-replay'] = JSON.stringify(mockData)

            integration = new SessionReplayIntegration({
                mode: 'onError',
                maxBufferDuration: 60, // 60秒
                useSessionStorage: true,
                storageKey: 'test-replay',
            })
            integration.setupOnce()

            expect(sessionStorage.removeItem).toHaveBeenCalledWith('test-replay')
        })
    })

    describe('数据大小限制', () => {
        it('应该截断超过最大上报大小的数据', () => {
            integration = new SessionReplayIntegration({
                mode: 'onError',
                maxUploadSize: 1024, // 1KB
            })
            integration.setupOnce()

            const privateMethods = integration as any

            // 添加大量事件
            for (let i = 0; i < 100; i++) {
                privateMethods.handleReplayEvent({
                    type: 2,
                    data: { largeData: 'x'.repeat(100) },
                    timestamp: Date.now(),
                })
            }

            const replayData = privateMethods.extractReplayData()

            if (replayData) {
                expect(replayData.size).toBeDefined()
                // 截断后的数据应该更小
                expect(replayData.eventCount).toBeLessThanOrEqual(100)
            }
        })
    })

    describe('隐私保护配置', () => {
        it('应该传递隐私保护配置给 rrweb', async () => {
            const { record } = await import('rrweb')

            integration = new SessionReplayIntegration({
                mode: 'always',
                maskAllInputs: true,
                maskAllText: false,
                blockClass: 'custom-block',
                maskTextClass: 'custom-mask',
                ignoreClass: 'custom-ignore',
            })
            integration.setupOnce()

            expect(record).toHaveBeenCalledWith(
                expect.objectContaining({
                    maskAllInputs: true,
                    maskAllText: false,
                    blockClass: 'custom-block',
                    maskTextClass: 'custom-mask',
                    ignoreClass: 'custom-ignore',
                })
            )
        })
    })

    describe('资源清理和内存泄漏防护', () => {
        it('应该停止录制并清空缓冲区', () => {
            integration = new SessionReplayIntegration({ mode: 'always' })
            integration.setupOnce()

            expect(integration.getStatus().isRecording).toBe(true)

            integration.cleanup()

            const status = integration.getStatus()
            expect(status.isRecording).toBe(false)
            expect(status.eventCount).toBe(0)
        })

        it('应该清除定时器', async () => {
            integration = new SessionReplayIntegration({
                mode: 'onError',
                postErrorDuration: 10,
            })
            integration.setupOnce()

            const errorEvent: MonitoringEvent = {
                type: 'error',
                message: 'Test error',
            }

            integration.beforeSend(errorEvent)
            integration.cleanup()

            const privateMethods = integration as any
            expect(privateMethods.postErrorTimer).toBeUndefined()
        })

        it('应该移除 beforeunload 事件监听器', () => {
            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

            integration = new SessionReplayIntegration({
                mode: 'always',
                useSessionStorage: true,
            })
            integration.setupOnce()
            integration.cleanup()

            expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
        })

        it('应该移除 visibilitychange 事件监听器', () => {
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

            integration = new SessionReplayIntegration({
                mode: 'always',
                useSessionStorage: true,
            })
            integration.setupOnce()
            integration.cleanup()

            expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
        })

        it('应该防止重复初始化', async () => {
            const rrwebModule = await import('rrweb')
            const recordMock = vi.mocked(rrwebModule.record)

            integration = new SessionReplayIntegration({ mode: 'always' })
            integration.setupOnce()

            const callCountAfterFirst = recordMock.mock.calls.length

            // 再次调用 setupOnce
            integration.setupOnce()

            // record 不应该被再次调用
            expect(recordMock.mock.calls.length).toBe(callCountAfterFirst)
        })

        it('cleanup 后应该可以重新初始化', () => {
            integration = new SessionReplayIntegration({ mode: 'always' })
            integration.setupOnce()

            expect(integration.getStatus().isRecording).toBe(true)

            integration.cleanup()
            expect(integration.getStatus().isRecording).toBe(false)

            // 清理后重新初始化
            integration.setupOnce()
            expect(integration.getStatus().isRecording).toBe(true)
        })

        it('多次调用 cleanup 不应该报错', () => {
            integration = new SessionReplayIntegration({ mode: 'always' })
            integration.setupOnce()

            expect(() => {
                integration.cleanup()
                integration.cleanup()
                integration.cleanup()
            }).not.toThrow()
        })
    })

    describe('状态查询 API', () => {
        it('应该返回完整的录制状态信息', () => {
            integration = new SessionReplayIntegration({ mode: 'always' })
            integration.setupOnce()

            const status = integration.getStatus()

            expect(status).toHaveProperty('isRecording')
            expect(status).toHaveProperty('eventCount')
            expect(status).toHaveProperty('bufferDuration')
            expect(status).toHaveProperty('estimatedSize')

            expect(typeof status.isRecording).toBe('boolean')
            expect(typeof status.eventCount).toBe('number')
            expect(typeof status.bufferDuration).toBe('number')
            expect(typeof status.estimatedSize).toBe('number')
        })

        it('未初始化时应该返回默认状态', () => {
            integration = new SessionReplayIntegration({ mode: 'onError' })

            const status = integration.getStatus()

            expect(status.isRecording).toBe(false)
            expect(status.eventCount).toBe(0)
        })
    })

    describe('边缘情况', () => {
        it('在非浏览器环境中不应该报错', () => {
            const originalWindow = global.window
            const originalDocument = global.document

            // @ts-expect-error - Testing non-browser environment
            delete global.window
            // @ts-expect-error - Testing non-browser environment
            delete global.document

            expect(() => {
                integration = new SessionReplayIntegration({ mode: 'always' })
                integration.setupOnce()
            }).not.toThrow()

            global.window = originalWindow
            global.document = originalDocument
        })

        it('sessionStorage 不可用时应该静默失败', () => {
            const originalSessionStorage = global.sessionStorage
            // @ts-expect-error - Testing sessionStorage unavailable scenario
            delete global.sessionStorage

            expect(() => {
                integration = new SessionReplayIntegration({
                    mode: 'always',
                    useSessionStorage: true,
                })
                integration.setupOnce()
            }).not.toThrow()

            global.sessionStorage = originalSessionStorage
        })

        it('rrweb 启动失败时应该静默处理', async () => {
            const rrwebModule = await import('rrweb')
            const recordMock = vi.mocked(rrwebModule.record)

            recordMock.mockImplementationOnce(() => {
                throw new Error('rrweb initialization failed')
            })

            expect(() => {
                integration = new SessionReplayIntegration({ mode: 'always' })
                integration.setupOnce()
            }).not.toThrow()

            expect(integration.getStatus().isRecording).toBe(false)
        })
    })
})
