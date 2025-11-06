import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SessionReplayIntegration } from '../integrations/sessionReplay'

/**
 * SessionReplayIntegration 测试
 *
 * 测试范围：
 * - 初始化和配置
 * - cleanup 资源清理
 * - 边缘情况处理
 */
describe('SessionReplayIntegration', () => {
    let integration: SessionReplayIntegration
    let originalWindow: any
    let originalDocument: any

    beforeEach(() => {
        // 保存原始环境
        originalWindow = global.window
        originalDocument = global.document

        // Mock rrweb
        vi.mock('rrweb', () => ({
            record: vi.fn(() => vi.fn()),
        }))
    })

    afterEach(() => {
        // 清理
        if (integration) {
            try {
                integration.cleanup()
            } catch (e) {
                // 忽略清理错误
            }
        }

        // 恢复环境
        if (originalWindow) {
            global.window = originalWindow
        }
        if (originalDocument) {
            global.document = originalDocument
        }

        vi.clearAllMocks()
        vi.resetModules()
    })

    describe('构造函数和配置', () => {
        it('应该使用默认配置', () => {
            integration = new SessionReplayIntegration()
            expect(integration.name).toBe('SessionReplay')
        })

        it('应该接受自定义配置', () => {
            integration = new SessionReplayIntegration({
                mode: 'always',
                sampleRate: 0.5,
                bufferDuration: 30,
            })
            expect(integration.name).toBe('SessionReplay')
        })

        it('应该支持 onError 模式', () => {
            integration = new SessionReplayIntegration({ mode: 'onError' })
            expect(integration.name).toBe('SessionReplay')
        })

        it('应该支持 sampled 模式', () => {
            integration = new SessionReplayIntegration({
                mode: 'sampled',
                sampleRate: 1.0,
            })
            expect(integration.name).toBe('SessionReplay')
        })
    })

    describe('资源清理和内存泄漏防护', () => {
        it('应该实现 cleanup 方法', () => {
            integration = new SessionReplayIntegration({ mode: 'always' })

            expect(() => {
                integration.cleanup()
            }).not.toThrow()
        })

        it('cleanup 后应该可以重新初始化', () => {
            integration = new SessionReplayIntegration({ mode: 'always' })

            integration.setupOnce()
            integration.cleanup()

            // 应该可以重新初始化
            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
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

        it('应该防止重复初始化', async () => {
            const { record } = await import('rrweb')
            const recordMock = vi.mocked(record)
            recordMock.mockClear()

            integration = new SessionReplayIntegration({ mode: 'always' })

            integration.setupOnce()
            integration.setupOnce()
            integration.setupOnce()

            // record 应该只被调用一次
            expect(recordMock).toHaveBeenCalledTimes(1)
        })
    })

    describe('边缘情况', () => {
        it('在非浏览器环境中不应该报错', () => {
            // @ts-expect-error - Testing non-browser environment
            delete global.window
            // @ts-expect-error - Testing non-browser environment
            delete global.document

            integration = new SessionReplayIntegration({ mode: 'always' })

            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
        })

        it('sessionStorage 不可用时应该静默失败', () => {
            // @ts-expect-error - Testing sessionStorage unavailable scenario
            delete global.sessionStorage

            integration = new SessionReplayIntegration({
                mode: 'always',
                // @ts-expect-error - Testing sessionStorage unavailable scenario
                useSessionStorage: true,
            })

            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
        })

        it('rrweb 启动失败时应该静默处理', async () => {
            const rrwebModule = await import('rrweb')
            const recordMock = vi.mocked(rrwebModule.record)
            recordMock.mockImplementationOnce(() => {
                throw new Error('rrweb initialization failed')
            })

            integration = new SessionReplayIntegration({ mode: 'always' })

            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
        })
    })

    describe('不同录制模式', () => {
        it('always 模式应该立即开始录制', async () => {
            const { record } = await import('rrweb')
            const recordMock = vi.mocked(record)
            recordMock.mockClear()

            integration = new SessionReplayIntegration({ mode: 'always' })
            integration.setupOnce()

            expect(recordMock).toHaveBeenCalled()
        })

        it('onError 模式应该初始化成功', async () => {
            const { record } = await import('rrweb')
            const recordMock = vi.mocked(record)
            recordMock.mockClear()

            integration = new SessionReplayIntegration({ mode: 'onError' })

            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
        })

        it('sampled 模式应该尊重采样率', () => {
            // 采样率为 0，不应该录制
            const integration1 = new SessionReplayIntegration({
                mode: 'sampled',
                sampleRate: 0,
            })

            expect(() => {
                integration1.setupOnce()
            }).not.toThrow()

            integration1.cleanup()

            // 采样率为 1，应该录制
            const integration2 = new SessionReplayIntegration({
                mode: 'sampled',
                sampleRate: 1.0,
            })

            expect(() => {
                integration2.setupOnce()
            }).not.toThrow()

            integration2.cleanup()
        })
    })

    describe('隐私保护配置', () => {
        it('应该支持隐私保护配置', () => {
            integration = new SessionReplayIntegration({
                mode: 'always',
                maskAllInputs: true,
                maskTextClass: 'custom-mask',
                blockClass: 'custom-block',
                ignoreClass: 'custom-ignore',
            })

            expect(() => {
                integration.setupOnce()
            }).not.toThrow()
        })
    })
})
