import React, { useState } from 'react'
import { TestResults } from '../components/TestResults'
import { type TestResult } from '../types'
import { captureException, captureMessage } from '../sdk'

export const ErrorsTab: React.FC = () => {
    const [results, setResults] = useState<TestResult[]>([])
    const [currentStep, setCurrentStep] = useState(0)

    const addResult = (type: 'success' | 'error' | 'info', message: string, details?: unknown) => {
        setResults(prev => [
            ...prev,
            {
                timestamp: new Date().toLocaleTimeString(),
                type,
                message,
                details,
            },
        ])
    }

    const nextStep = () => {
        setCurrentStep(prev => Math.min(prev + 1, 5))
    }

    const resetTest = () => {
        setResults([])
        setCurrentStep(0)
        addResult('info', '测试已重置，请按步骤开始测试')
    }

    const testJavaScriptError = () => {
        addResult('info', '步骤 1: 触发 JavaScript 错误...')
        // 不要用 try-catch 包裹，让 SDK 的全局错误监听器捕获
        setTimeout(() => {
            // @ts-expect-error - Intentionally calling undefined function for testing
            undefinedFunction()
        }, 100)
        addResult('success', 'JavaScript 错误已触发')
        addResult('info', 'SDK 将自动捕获并上报到 /critical')
        addResult('info', 'SessionReplay 将开始录制（触发 window.error 事件）')
        nextStep()
    }

    const testPromiseRejection = () => {
        addResult('info', '步骤 2: 触发 Promise Rejection...')
        // 不要用 .catch() 捕获，让 SDK 的 unhandledrejection 监听器捕获
        Promise.reject(new Error('测试 Promise Rejection'))
        addResult('success', 'Promise Rejection 已触发')
        addResult('info', 'SDK 将自动捕获并上报到 /critical')
        addResult('info', 'SessionReplay 将开始录制（触发 window.unhandledrejection 事件）')
        nextStep()
    }

    const testManualCapture = () => {
        addResult('info', '步骤 3: 手动捕获错误...')
        try {
            throw new Error('手动捕获的测试错误')
        } catch (error) {
            captureException(error as Error)
            addResult('success', '错误已通过 captureException 上报')
            addResult('info', '错误将上报到 /critical')
            addResult('info', '注意：手动捕获的错误不会触发 SessionReplay（未触发 window.error）')
            nextStep()
        }
    }

    const testCaptureMessage = () => {
        addResult('info', '步骤 4: 发送自定义消息...')
        captureMessage('这是一条测试消息')
        addResult('success', '消息已通过 captureMessage 上报')
        addResult('info', '消息将上报到 /batch（批量队列）')
        addResult('info', '注意：自定义消息不会触发 SessionReplay')
        nextStep()
    }

    const checkNetwork = () => {
        addResult('info', '步骤 5: 检查 Network 面板...')
        addResult('success', '请打开浏览器 DevTools 的 Network 面板')
        addResult('info', '验证 /critical - 应该有 3 个请求（步骤 1、2、3）')
        addResult('info', '验证 /batch - 应该有 1 个请求（步骤 4）')
        addResult('info', '验证 /replay - 应该有 2 个请求（步骤 1、2 各触发 1 次）')
        nextStep()
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">错误捕获测试</h2>
                <p className="text-gray-600">测试 ErrorsIntegration 的各种错误捕获功能</p>
            </div>

            {/* 测试步骤指引 */}
            <div className="border border-blue-500 p-6 bg-blue-50">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span>测试步骤</span>
                    <button onClick={resetTest} className="ml-auto px-3 py-1 text-sm bg-white border border-gray-300 hover:bg-gray-50">
                        重置测试
                    </button>
                </h3>
                <div className="space-y-3 text-sm">
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 1 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 1 ? '[完成]' : '[1]'} 步骤 1</span>
                        <div>
                            <div className="font-semibold">触发 JavaScript 错误</div>
                            <div className="text-gray-600">触发 window.error 事件 - 上报到 /critical + 触发 SessionReplay</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 2 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 2 ? '[完成]' : '[2]'} 步骤 2</span>
                        <div>
                            <div className="font-semibold">触发 Promise Rejection</div>
                            <div className="text-gray-600">触发 window.unhandledrejection 事件 - 上报到 /critical + 触发 SessionReplay</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 3 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 3 ? '[完成]' : '[3]'} 步骤 3</span>
                        <div>
                            <div className="font-semibold">手动捕获错误</div>
                            <div className="text-gray-600">使用 captureException - 上报到 /critical（不触发 SessionReplay）</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 4 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 4 ? '[完成]' : '[4]'} 步骤 4</span>
                        <div>
                            <div className="font-semibold">发送自定义消息</div>
                            <div className="text-gray-600">使用 captureMessage - 上报到 /batch（批量队列）</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 5 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 5 ? '[完成]' : '[5]'} 步骤 5</span>
                        <div>
                            <div className="font-semibold">检查 Network 面板</div>
                            <div className="text-gray-600">验证 /critical、/batch、/replay 请求是否正确发送</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 数据流说明 */}
            <div className="border border-gray-300 p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">数据流说明</h3>
                <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[80px]">1. 捕获</span>
                        <span>SDK 通过全局监听器（window.onerror, unhandledrejection）自动捕获错误</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[80px]">2. 路由</span>
                        <span>TransportRouter 根据事件类型路由：error/exception - /critical（立即），message - /batch（批量）</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[80px]">3. Replay</span>
                        <span>SessionReplay 只在 window.error 和 window.unhandledrejection 时触发，手动捕获不触发</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[80px]">4. 队列</span>
                        <span>批量事件先存入内存队列（BatchedTransport），达到 batchSize 或 flushInterval 后发送</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[80px]">5. 离线</span>
                        <span>网络失败时，事件存入 LocalStorage（OfflineTransport），网络恢复后自动重试</span>
                    </div>
                </div>
            </div>

            {/* 测试按钮 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">测试操作（请按顺序点击）</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`border p-4 ${currentStep === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[1] JavaScript 错误</h4>
                        <p className="text-sm text-gray-600 mb-3">触发 window.error 事件 - /critical + SessionReplay</p>
                        <button
                            onClick={testJavaScriptError}
                            className={`w-full px-4 py-2 font-medium transition-colors ${
                                currentStep === 0
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={currentStep !== 0}
                        >
                            {currentStep > 0 ? '已完成' : '点击测试'}
                        </button>
                    </div>

                    <div className={`border p-4 ${currentStep === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[2] Promise Rejection</h4>
                        <p className="text-sm text-gray-600 mb-3">触发 window.unhandledrejection 事件 - /critical + SessionReplay</p>
                        <button
                            onClick={testPromiseRejection}
                            className={`w-full px-4 py-2 font-medium transition-colors ${
                                currentStep === 1
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={currentStep !== 1}
                        >
                            {currentStep > 1 ? '已完成' : currentStep < 1 ? '等待步骤 1' : '点击测试'}
                        </button>
                    </div>

                    <div className={`border p-4 ${currentStep === 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[3] 手动捕获错误</h4>
                        <p className="text-sm text-gray-600 mb-3">使用 captureException - /critical（不触发 SessionReplay）</p>
                        <button
                            onClick={testManualCapture}
                            className={`w-full px-4 py-2 font-medium transition-colors ${
                                currentStep === 2
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={currentStep !== 2}
                        >
                            {currentStep > 2 ? '已完成' : currentStep < 2 ? '等待步骤 2' : '点击测试'}
                        </button>
                    </div>

                    <div className={`border p-4 ${currentStep === 3 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[4] 自定义消息</h4>
                        <p className="text-sm text-gray-600 mb-3">使用 captureMessage - /batch（批量队列）</p>
                        <button
                            onClick={testCaptureMessage}
                            className={`w-full px-4 py-2 font-medium transition-colors ${
                                currentStep === 3
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={currentStep !== 3}
                        >
                            {currentStep > 3 ? '已完成' : currentStep < 3 ? '等待步骤 3' : '点击测试'}
                        </button>
                    </div>

                    <div className={`border p-4 ${currentStep === 4 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[5] 检查 Network</h4>
                        <p className="text-sm text-gray-600 mb-3">验证所有请求是否正确发送</p>
                        <button
                            onClick={checkNetwork}
                            className={`w-full px-4 py-2 font-medium transition-colors ${
                                currentStep === 4
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={currentStep !== 4}
                        >
                            {currentStep > 4 ? '已完成' : currentStep < 4 ? '等待步骤 4' : '点击检查'}
                        </button>
                    </div>
                </div>

                {currentStep === 5 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-500 rounded">
                        <p className="text-green-700 font-semibold">所有测试步骤已完成，请打开 Network 面板检查以下请求：</p>
                        <ul className="mt-2 text-sm text-green-700 space-y-1">
                            <li>- /critical - 应该有 3 个请求（JS 错误、Promise Rejection、手动捕获）</li>
                            <li>- /batch - 应该有 1 个请求（自定义消息）</li>
                            <li>- /replay - 应该有 2 个请求（JS 错误和 Promise Rejection 触发）</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* 测试结果 */}
            <TestResults results={results} />
        </div>
    )
}
