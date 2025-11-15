import React, { useState, useEffect } from 'react'
import { getSDKClient } from '../sdk'

/**
 * React 测试 Tab
 *
 * 测试 React 特有的功能:
 * 1. 组件错误边界 (Error Boundary)
 * 2. React 生命周期错误
 * 3. 事件处理器错误
 * 4. 异步操作错误
 * 5. React 性能监控
 */
export const ReactTab: React.FC = () => {
    const [errorCount, setErrorCount] = useState(0)
    const [renderCount, setRenderCount] = useState(0)
    const [showErrorComponent, setShowErrorComponent] = useState(false)

    useEffect(() => {
        setRenderCount(prev => prev + 1)
    }, [])

    // 测试 1: 同步错误
    const handleSyncError = () => {
        try {
            throw new Error('React 同步错误测试')
        } catch (error) {
            const client = getSDKClient()
            if (client) {
                client.captureError(error as Error, {
                    tags: { test: 'react-sync-error' },
                    extra: { component: 'ReactTab' },
                })
            }
            setErrorCount(prev => prev + 1)
        }
    }

    // 测试 2: 异步错误
    const handleAsyncError = async () => {
        try {
            await new Promise((_, reject) => {
                setTimeout(() => reject(new Error('React 异步错误测试')), 100)
            })
        } catch (error) {
            const client = getSDKClient()
            if (client) {
                client.captureError(error as Error, {
                    tags: { test: 'react-async-error' },
                    extra: { component: 'ReactTab' },
                })
            }
            setErrorCount(prev => prev + 1)
        }
    }

    // 测试 3: 事件处理器错误
    const handleEventError = () => {
        const client = getSDKClient()
        if (client) {
            client.captureError(new Error('React 事件处理器错误'), {
                tags: { test: 'react-event-error' },
                extra: { eventType: 'onClick' },
            })
        }
        setErrorCount(prev => prev + 1)
    }

    // 测试 4: useEffect 错误
    const handleEffectError = () => {
        setShowErrorComponent(true)
    }

    // 测试 5: 性能监控
    const handlePerformanceTest = () => {
        const client = getSDKClient()
        if (client) {
            // 模拟慢渲染
            const start = performance.now()
            let sum = 0
            for (let i = 0; i < 10000000; i++) {
                sum += i
            }
            const duration = performance.now() - start

            client.captureMessage('React 组件渲染性能', {
                level: 'info',
                tags: { test: 'react-performance' },
                extra: {
                    component: 'ReactTab',
                    renderDuration: duration,
                    renderCount,
                },
            })
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">React 测试</h2>
                <p className="text-gray-600">测试 React 组件的错误捕获和性能监控</p>
            </div>

            {/* 统计信息 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">统计信息</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 border border-gray-300">
                        <div className="text-sm text-gray-600">错误数量</div>
                        <div className="text-2xl font-bold">{errorCount}</div>
                    </div>
                    <div className="p-4 bg-gray-50 border border-gray-300">
                        <div className="text-sm text-gray-600">渲染次数</div>
                        <div className="text-2xl font-bold">{renderCount}</div>
                    </div>
                </div>
            </div>

            {/* 错误测试 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">错误测试</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={handleSyncError}
                        className="p-4 border-2 border-black hover:bg-black hover:text-white transition-colors"
                    >
                        <div className="font-semibold mb-1">同步错误</div>
                        <div className="text-sm opacity-70">测试 try-catch 捕获</div>
                    </button>

                    <button
                        onClick={handleAsyncError}
                        className="p-4 border-2 border-black hover:bg-black hover:text-white transition-colors"
                    >
                        <div className="font-semibold mb-1">异步错误</div>
                        <div className="text-sm opacity-70">测试 Promise rejection</div>
                    </button>

                    <button
                        onClick={handleEventError}
                        className="p-4 border-2 border-black hover:bg-black hover:text-white transition-colors"
                    >
                        <div className="font-semibold mb-1">事件处理器错误</div>
                        <div className="text-sm opacity-70">测试 onClick 错误</div>
                    </button>

                    <button
                        onClick={handleEffectError}
                        className="p-4 border-2 border-black hover:bg-black hover:text-white transition-colors"
                    >
                        <div className="font-semibold mb-1">useEffect 错误</div>
                        <div className="text-sm opacity-70">测试生命周期错误</div>
                    </button>
                </div>
            </div>

            {/* 性能测试 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">性能测试</h3>
                <button
                    onClick={handlePerformanceTest}
                    className="w-full p-4 border-2 border-black hover:bg-black hover:text-white transition-colors"
                >
                    <div className="font-semibold mb-1">组件渲染性能</div>
                    <div className="text-sm opacity-70">测试慢渲染监控</div>
                </button>
            </div>

            {/* 错误组件 */}
            {showErrorComponent && <ErrorComponent onClose={() => setShowErrorComponent(false)} />}
        </div>
    )
}

/**
 * 错误组件 - 用于测试 useEffect 错误
 */
const ErrorComponent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    useEffect(() => {
        const client = getSDKClient()
        if (client) {
            client.captureError(new Error('useEffect 错误测试'), {
                tags: { test: 'react-effect-error' },
                extra: { component: 'ErrorComponent' },
            })
        }

        // 自动关闭
        const timer = setTimeout(() => {
            onClose()
        }, 2000)

        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 border-2 border-black max-w-md">
                <h3 className="text-lg font-semibold mb-2">错误组件</h3>
                <p className="text-gray-600 mb-4">这个组件在 useEffect 中触发了一个错误</p>
                <button onClick={onClose} className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors">
                    关闭
                </button>
            </div>
        </div>
    )
}
