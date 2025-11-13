import { useState } from 'react'
import { getSDKClient, captureException, captureMessage, addBreadcrumb } from '../sdk'

interface TestResult {
    type: 'success' | 'error' | 'info'
    message: string
    details?: unknown
}

export const OfflineTab: React.FC = () => {
    const [results, setResults] = useState<TestResult[]>([])
    const [isOffline, setIsOffline] = useState(false)
    const [queueSize, setQueueSize] = useState(0)
    const [currentStep, setCurrentStep] = useState(0)

    const addResult = (type: 'success' | 'error' | 'info', message: string, details?: unknown) => {
        setResults(prev => [
            ...prev,
            {
                type,
                message,
                details,
                timestamp: new Date().toLocaleTimeString(),
            } as TestResult,
        ])
    }

    const nextStep = () => {
        setCurrentStep(prev => prev + 1)
    }

    const resetTest = () => {
        setResults([])
        setCurrentStep(0)
        setQueueSize(0)
    }

    const simulateOffline = () => {
        // 模拟断网
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false,
        })

        // 触发 offline 事件
        window.dispatchEvent(new Event('offline'))

        setIsOffline(true)
        addResult('info', '已模拟断网状态 (navigator.onLine = false)')
        addResult('info', '现在触发的事件会被缓存到离线队列中')
        nextStep()
    }

    const simulateOnline = () => {
        // 模拟恢复网络
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
        })

        // 触发 online 事件
        window.dispatchEvent(new Event('online'))

        setIsOffline(false)
        addResult('success', '已恢复网络连接 (navigator.onLine = true)')
        addResult('info', '离线队列中的事件将自动上报到服务器')
        nextStep()
    }

    const triggerErrorOffline = () => {
        try {
            addResult('info', '步骤 1: 在离线状态下触发错误...')

            // 触发一个错误
            captureException(new Error('离线状态下的测试错误'))

            addResult('success', '错误已触发,应该被缓存到离线队列')
            updateQueueSize()
            nextStep()
        } catch (error) {
            addResult('error', '触发错误失败', error)
        }
    }

    const triggerMessageOffline = () => {
        try {
            addResult('info', '步骤 2: 在离线状态下发送消息...')

            // 发送消息
            captureMessage('离线状态下的测试消息', 'info')

            addResult('success', '消息已发送,应该被缓存到离线队列')
            updateQueueSize()
            nextStep()
        } catch (error) {
            addResult('error', '发送消息失败', error)
        }
    }

    const triggerBreadcrumbOffline = () => {
        try {
            addResult('info', '步骤 3: 在离线状态下添加 Breadcrumb...')

            // 添加 breadcrumb
            addBreadcrumb({
                message: '离线状态下的用户操作',
                category: 'user-action',
                level: 'info',
            })

            addResult('success', 'Breadcrumb 已添加')
            nextStep()
        } catch (error) {
            addResult('error', '添加 Breadcrumb 失败', error)
        }
    }

    const updateQueueSize = () => {
        const client = getSDKClient()
        if (!client) {
            addResult('error', 'SDK 未初始化')
            return
        }

        // 尝试获取离线队列大小
        // 注意: 这需要 OfflineTransport 暴露一个方法来获取队列大小
        // 目前我们只能估算
        setQueueSize(prev => prev + 1)
    }

    const checkQueueStatus = () => {
        addResult('info', `当前离线队列中约有 ${queueSize} 个事件`)
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">离线队列测试</h2>
                <p className="text-gray-600">测试 SDK 的离线队列功能,验证断网时事件缓存和恢复后自动上报</p>
            </div>

            {/* 网络状态指示器 */}
            <div className={`border p-4 ${isOffline ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg">网络状态: {isOffline ? '🔴 离线' : '🟢 在线'}</h3>
                        <p className="text-sm text-gray-600 mt-1">navigator.onLine = {navigator.onLine ? 'true' : 'false'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">离线队列大小</p>
                        <p className="text-2xl font-bold">{queueSize}</p>
                    </div>
                </div>
            </div>

            {/* 测试步骤 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">测试步骤</h3>

                <div className="space-y-3">
                    <button
                        onClick={resetTest}
                        className="w-full px-4 py-2 bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors"
                    >
                        重置测试
                    </button>

                    <button
                        onClick={simulateOffline}
                        disabled={isOffline}
                        className={`w-full px-4 py-2 font-medium transition-colors ${
                            isOffline ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                    >
                        [1] 模拟断网
                    </button>

                    <button
                        onClick={triggerErrorOffline}
                        disabled={!isOffline || currentStep < 1}
                        className={`w-full px-4 py-2 font-medium transition-colors ${
                            !isOffline || currentStep < 1
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                    >
                        [2] 触发错误 (离线)
                    </button>

                    <button
                        onClick={triggerMessageOffline}
                        disabled={!isOffline || currentStep < 2}
                        className={`w-full px-4 py-2 font-medium transition-colors ${
                            !isOffline || currentStep < 2
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                    >
                        [3] 发送消息 (离线)
                    </button>

                    <button
                        onClick={triggerBreadcrumbOffline}
                        disabled={!isOffline || currentStep < 3}
                        className={`w-full px-4 py-2 font-medium transition-colors ${
                            !isOffline || currentStep < 3
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                    >
                        [4] 添加 Breadcrumb (离线)
                    </button>

                    <button
                        onClick={checkQueueStatus}
                        disabled={!isOffline || currentStep < 4}
                        className={`w-full px-4 py-2 font-medium transition-colors ${
                            !isOffline || currentStep < 4
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        [5] 检查队列状态
                    </button>

                    <button
                        onClick={simulateOnline}
                        disabled={!isOffline || currentStep < 5}
                        className={`w-full px-4 py-2 font-medium transition-colors ${
                            !isOffline || currentStep < 5
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                        [6] 恢复网络连接
                    </button>
                </div>
            </div>

            {/* 测试结果 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">测试结果</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">暂无测试结果</p>
                    ) : (
                        results.map((result, index) => (
                            <div
                                key={index}
                                className={`p-3 border-l-4 ${
                                    result.type === 'success'
                                        ? 'border-green-500 bg-green-50'
                                        : result.type === 'error'
                                          ? 'border-red-500 bg-red-50'
                                          : 'border-blue-500 bg-blue-50'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium">{result.message}</p>
                                        {result.details && (
                                            <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
                                                {JSON.stringify(result.details, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500 ml-2">{(result as any).timestamp}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 说明文档 */}
            <div className="border border-gray-300 p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">测试说明</h3>
                <div className="space-y-2 text-sm text-gray-700">
                    <p>
                        <strong>离线队列功能:</strong> 当网络断开时,SDK 会将事件缓存到本地队列中,网络恢复后自动上报
                    </p>
                    <p>
                        <strong>测试流程:</strong>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                        <li>点击 "模拟断网" 设置 navigator.onLine = false</li>
                        <li>在离线状态下触发各种事件 (错误、消息、Breadcrumb)</li>
                        <li>观察离线队列大小增加</li>
                        <li>点击 "恢复网络连接" 设置 navigator.onLine = true</li>
                        <li>检查 DSN 服务器日志,验证事件是否成功上报</li>
                    </ol>
                    <p className="mt-3">
                        <strong>注意:</strong> 离线队列功能需要在 SDK 初始化时启用 enableOffline: true
                    </p>
                </div>
            </div>
        </div>
    )
}
