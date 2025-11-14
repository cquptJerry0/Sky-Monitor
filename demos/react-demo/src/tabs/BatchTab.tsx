import React, { useState } from 'react'
import { TestResults } from '../components/TestResults'
import { type TestResult } from '../types'
import { captureException, captureMessage } from '../sdk'

export const BatchTab: React.FC = () => {
    const [results, setResults] = useState<TestResult[]>([])
    const [currentStep, setCurrentStep] = useState(0)
    const [isGenerating, setIsGenerating] = useState(false)

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
        setCurrentStep(prev => Math.min(prev + 1, 3))
    }

    const resetTest = () => {
        setResults([])
        setCurrentStep(0)
        addResult('info', '测试已重置，请按步骤开始测试')
    }

    const testBatchErrors = async () => {
        addResult('info', '步骤 1: 批量生成 100 个不同错误...')
        setIsGenerating(true)

        try {
            for (let i = 0; i < 100; i++) {
                captureException(new Error(`测试错误 #${i + 1}`))

                // 每 10 个显示一次进度
                if ((i + 1) % 10 === 0) {
                    addResult('info', `已生成 ${i + 1} 个错误...`)
                }

                // 避免阻塞 UI
                if ((i + 1) % 20 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10))
                }
            }

            addResult('success', '已生成 100 个错误事件')
            addResult('info', '错误事件会立即上报到 /critical（不批量）')
            addResult('info', '预期：100 个 /critical 请求（每个错误单独上报）')
            addResult('info', '注意：去重逻辑会在 5 秒内过滤重复错误')
            nextStep()
        } finally {
            setIsGenerating(false)
        }
    }

    const testBatchMessages = async () => {
        addResult('info', '步骤 2: 批量生成 100 个不同消息...')
        setIsGenerating(true)

        try {
            for (let i = 0; i < 100; i++) {
                captureMessage(`测试消息 #${i + 1}`)

                if ((i + 1) % 10 === 0) {
                    addResult('info', `已生成 ${i + 1} 个消息...`)
                }

                if ((i + 1) % 20 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10))
                }
            }

            addResult('success', '已生成 100 个消息事件')
            addResult('info', 'SDK 将批量上报到 /batch（batchSize: 20, flushInterval: 5s）')
            addResult('info', '预期：5 个 /batch 请求，每个包含 20 个消息')
            addResult('info', '批量触发条件：1) 队列达到 20 个 或 2) 5 秒定时器触发')
            addResult('info', '注意：去重逻辑会在 5 秒内过滤重复消息')
            nextStep()
        } finally {
            setIsGenerating(false)
        }
    }

    const testMixedBatch = async () => {
        addResult('info', '步骤 3: 批量生成混合事件（50 错误 + 50 消息）...')
        setIsGenerating(true)

        try {
            for (let i = 0; i < 50; i++) {
                captureException(new Error(`混合错误 #${i + 1}`))
                captureMessage(`混合消息 #${i + 1}`)

                if ((i + 1) % 10 === 0) {
                    addResult('info', `已生成 ${(i + 1) * 2} 个事件...`)
                }

                if ((i + 1) % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10))
                }
            }

            addResult('success', '已生成 100 个混合事件（50 错误 + 50 消息）')
            addResult('info', '错误立即上报到 /critical（不批量），消息批量上报到 /batch')
            addResult('info', '预期：50 个 /critical 请求 + 3 个 /batch 请求')
            addResult('info', '注意：去重逻辑会过滤 5 秒内的重复事件')
            nextStep()
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">批量上报测试</h2>
                <p className="text-gray-600">测试 BatchTransport 的批量上报功能</p>
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
                            <div className="font-semibold">批量生成错误</div>
                            <div className="text-gray-600">生成 100 个不同错误 - 立即上报到 /critical（不批量）</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 2 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 2 ? '[完成]' : '[2]'} 步骤 2</span>
                        <div>
                            <div className="font-semibold">批量生成消息</div>
                            <div className="text-gray-600">生成 100 个不同消息 - 批量上报到 /batch（每批 20 个）</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 3 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 3 ? '[完成]' : '[3]'} 步骤 3</span>
                        <div>
                            <div className="font-semibold">混合批量上报</div>
                            <div className="text-gray-600">生成 50 错误 + 50 消息 - 错误立即上报，消息批量上报</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 数据流说明 */}
            <div className="border border-gray-300 p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">批量上报机制</h3>
                <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[140px]">1. 事件路由</span>
                        <span>TransportRouter 根据事件类型路由：错误 → /critical（立即），其他 → /batch（批量）</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[140px]">2. 错误立即上报</span>
                        <span>错误事件使用 BrowserTransport 立即发送，不批量（每个错误单独请求）</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[140px]">3. 消息批量上报</span>
                        <span>消息事件使用 BatchedTransport 批量发送（batchSize: 20, flushInterval: 5s）</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[140px]">4. 批量触发条件</span>
                        <span>队列达到 20 个事件 或 5 秒定时器触发（两者满足其一即上报）</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[140px]">5. 去重过滤</span>
                        <span>DeduplicationIntegration 在 5 秒内过滤相同指纹的重复事件</span>
                    </div>
                </div>
            </div>

            {/* 测试操作 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">测试操作（请按顺序点击）</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`border p-4 ${currentStep === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[1] 批量错误</h4>
                        <p className="text-sm text-gray-600 mb-3">生成 100 个不同错误事件</p>
                        <button
                            onClick={testBatchErrors}
                            className={`w-full px-4 py-2 font-medium transition-colors ${
                                currentStep === 0
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={currentStep !== 0 || isGenerating}
                        >
                            {isGenerating ? '生成中...' : currentStep > 0 ? '已完成' : '点击测试'}
                        </button>
                    </div>

                    <div className={`border p-4 ${currentStep === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[2] 批量消息</h4>
                        <p className="text-sm text-gray-600 mb-3">生成 100 个不同消息事件</p>
                        <button
                            onClick={testBatchMessages}
                            className={`w-full px-4 py-2 font-medium transition-colors ${
                                currentStep === 1
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={currentStep !== 1 || isGenerating}
                        >
                            {isGenerating ? '生成中...' : currentStep > 1 ? '已完成' : currentStep < 1 ? '等待步骤 1' : '点击测试'}
                        </button>
                    </div>

                    <div className={`border p-4 ${currentStep === 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[3] 混合批量</h4>
                        <p className="text-sm text-gray-600 mb-3">生成 50 错误 + 50 消息</p>
                        <button
                            onClick={testMixedBatch}
                            className={`w-full px-4 py-2 font-medium transition-colors ${
                                currentStep === 2
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={currentStep !== 2 || isGenerating}
                        >
                            {isGenerating ? '生成中...' : currentStep > 2 ? '已完成' : currentStep < 2 ? '等待步骤 2' : '点击测试'}
                        </button>
                    </div>
                </div>

                {currentStep === 3 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-500 rounded">
                        <p className="text-green-700 font-semibold">所有测试步骤已完成，请打开 Network 面板检查以下请求：</p>
                        <ul className="mt-2 text-sm text-green-700 space-y-1">
                            <li>- 步骤 1：应该有 5 个 /critical 请求，每个包含 20 个错误</li>
                            <li>- 步骤 2：应该有 5 个 /batch 请求，每个包含 20 个消息</li>
                            <li>- 步骤 3：应该有 3 个 /critical 请求 + 3 个 /batch 请求</li>
                            <li>- 注意：去重机制可能会过滤掉部分重复事件</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* 测试结果 */}
            <TestResults results={results} />
        </div>
    )
}
