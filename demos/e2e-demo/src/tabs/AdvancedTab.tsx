import React, { useState } from 'react'
import { TestResults } from '../components/TestResults'
import { type TestResult } from '../types'
import { captureException } from '../sdk'

export const AdvancedTab: React.FC = () => {
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
        setCurrentStep(prev => Math.min(prev + 1, 3))
    }

    const resetTest = () => {
        setResults([])
        setCurrentStep(0)
        addResult('info', '测试已重置，请按步骤开始测试')
    }

    const testSampling = () => {
        addResult('info', '步骤 1: 测试采样功能...')
        addResult('success', '错误采样率: 100%, Web Vitals 采样率: 100%')
        addResult('info', 'SamplingIntegration 根据采样率决定是否上报事件')
        addResult('info', '采样率 100% 表示所有事件都会被上报')
        nextStep()
    }

    const testDeduplication = () => {
        addResult('info', '步骤 2: 测试去重功能...')
        for (let i = 0; i < 5; i++) {
            try {
                throw new Error('重复错误测试')
            } catch (error) {
                captureException(error as Error)
            }
        }
        addResult('success', '连续触发 5 次相同错误')
        addResult('info', '去重时间窗口: 5000ms，重复错误将被过滤')
        addResult('info', '打开 Network 面板，应该只有 1 个 /critical 请求')
        nextStep()
    }

    const testSession = () => {
        addResult('info', '步骤 3: 查看会话信息...')
        addResult('success', 'SessionIntegration 已自动追踪会话')
        addResult('info', '会话超时时间: 30 分钟')
        addResult('info', '所有事件都会附加 sessionId 字段')
        nextStep()
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">高级功能测试</h2>
                <p className="text-gray-600">测试 SamplingIntegration、DeduplicationIntegration 和 SessionIntegration</p>
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
                            <div className="font-semibold">测试采样功能</div>
                            <div className="text-gray-600">查看采样配置 - SamplingIntegration 根据采样率过滤事件</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 2 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 2 ? '[完成]' : '[2]'} 步骤 2</span>
                        <div>
                            <div className="font-semibold">测试去重功能</div>
                            <div className="text-gray-600">连续触发 5 次相同错误 - DeduplicationIntegration 过滤重复事件</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 3 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 3 ? '[完成]' : '[3]'} 步骤 3</span>
                        <div>
                            <div className="font-semibold">查看会话追踪</div>
                            <div className="text-gray-600">SessionIntegration 自动生成 sessionId 并附加到所有事件</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 数据流说明 */}
            <div className="border border-gray-300 p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">数据流说明</h3>
                <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">1. 采样</span>
                        <span>SamplingIntegration 根据采样率（sampleRate）决定是否上报事件</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">2. 去重</span>
                        <span>DeduplicationIntegration 使用指纹（fingerprint）识别重复事件，5 秒内只保留第一个</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">3. 会话</span>
                        <span>SessionIntegration 生成唯一 sessionId，30 分钟无活动后过期</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">4. 执行顺序</span>
                        <span>Session - Sampling - Deduplication - Transport（按 Integration 顺序执行）</span>
                    </div>
                </div>
            </div>

            {/* 测试按钮 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">测试操作（请按顺序点击）</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`border p-4 ${currentStep === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[1] 采样功能</h4>
                        <p className="text-sm text-gray-600 mb-3">查看采样配置和工作原理</p>
                        <button
                            onClick={testSampling}
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
                        <h4 className="font-semibold mb-2">[2] 去重功能</h4>
                        <p className="text-sm text-gray-600 mb-3">连续触发相同错误，测试去重</p>
                        <button
                            onClick={testDeduplication}
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
                        <h4 className="font-semibold mb-2">[3] 会话追踪</h4>
                        <p className="text-sm text-gray-600 mb-3">查看会话追踪信息</p>
                        <button
                            onClick={testSession}
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
                </div>

                {currentStep === 3 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-500 rounded">
                        <p className="text-green-700 font-semibold">所有测试步骤已完成，请验证以下内容：</p>
                        <ul className="mt-2 text-sm text-green-700 space-y-1">
                            <li>- 采样率 100% - 所有事件都会被上报</li>
                            <li>- 去重功能 - 5 次相同错误只上报 1 次（查看 Network 面板）</li>
                            <li>- 会话追踪 - 所有事件都包含相同的 sessionId</li>
                        </ul>
                    </div>
                )}
            </div>

            <TestResults results={results} />
        </div>
    )
}
