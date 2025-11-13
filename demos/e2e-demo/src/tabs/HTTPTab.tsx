import React, { useState } from 'react'
import { TestResults } from '../components/TestResults'
import { type TestResult } from '../types'

export const HTTPTab: React.FC = () => {
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
        setCurrentStep(prev => Math.min(prev + 1, 4))
    }

    const resetTest = () => {
        setResults([])
        setCurrentStep(0)
        addResult('info', '测试已重置，请按步骤开始测试')
    }

    const testHTTP404 = async () => {
        addResult('info', '步骤 1: 触发 HTTP 404 错误...')
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts/999999')
            addResult('success', `HTTP ${response.status} 已被 HttpErrorIntegration 捕获`)
            addResult('info', 'HTTP 错误将上报到 /critical')
            nextStep()
        } catch (error) {
            addResult('error', '请求失败', error)
        }
    }

    const testHTTP500 = async () => {
        addResult('info', '步骤 2: 触发 HTTP 500 错误...')
        try {
            const response = await fetch('https://httpstat.us/500')
            addResult('success', `HTTP ${response.status} 已被 HttpErrorIntegration 捕获`)
            addResult('info', 'HTTP 错误将上报到 /critical')
        } catch (error) {
            nextStep()
            addResult('error', '请求失败', error)
        }
    }

    const testResourceError = () => {
        addResult('info', '步骤 3: 触发资源加载错误...')
        const img = new Image()
        img.onerror = () => {
            addResult('success', '资源加载错误已被 ResourceErrorIntegration 捕获')
            addResult('info', '资源错误将上报到 /critical')
            nextStep()
        }
        img.src = 'https://invalid-domain-12345.com/image.png'
    }

    const testScriptError = () => {
        addResult('info', '步骤 4: 触发脚本加载错误...')
        const script = document.createElement('script')
        script.onerror = () => {
            addResult('success', '脚本加载错误已被 ResourceErrorIntegration 捕获')
            addResult('info', '资源错误将上报到 /critical')
            nextStep()
        }
        script.src = 'https://invalid-domain-12345.com/script.js'
        document.head.appendChild(script)
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">HTTP & 资源错误测试</h2>
                <p className="text-gray-600">测试 HttpErrorIntegration 和 ResourceErrorIntegration</p>
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
                            <div className="font-semibold">触发 HTTP 404 错误</div>
                            <div className="text-gray-600">请求不存在的资源 - HttpErrorIntegration 捕获 - 上报到 /critical</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 2 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 2 ? '[完成]' : '[2]'} 步骤 2</span>
                        <div>
                            <div className="font-semibold">触发 HTTP 500 错误</div>
                            <div className="text-gray-600">请求返回服务器错误 - HttpErrorIntegration 捕获 - 上报到 /critical</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 3 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 3 ? '[完成]' : '[3]'} 步骤 3</span>
                        <div>
                            <div className="font-semibold">触发图片加载错误</div>
                            <div className="text-gray-600">加载无效图片 - ResourceErrorIntegration 捕获 - 上报到 /critical</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 4 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 4 ? '[完成]' : '[4]'} 步骤 4</span>
                        <div>
                            <div className="font-semibold">触发脚本加载错误</div>
                            <div className="text-gray-600">加载无效脚本 - ResourceErrorIntegration 捕获 - 上报到 /critical</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 数据流说明 */}
            <div className="border border-gray-300 p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">数据流说明</h3>
                <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">1. HTTP 错误</span>
                        <span>HttpErrorIntegration 拦截 fetch/XHR，检测 4xx/5xx 状态码</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">2. 资源错误</span>
                        <span>ResourceErrorIntegration 监听 window.error 事件，捕获资源加载失败</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">3. 立即上报</span>
                        <span>HTTP 和资源错误通过 CriticalTransport 立即发送到 /critical 端点</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">4. 错误详情</span>
                        <span>包含 URL、状态码、错误消息、堆栈信息等</span>
                    </div>
                </div>
            </div>

            {/* 测试按钮 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">测试操作（请按顺序点击）</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`border p-4 ${currentStep === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[1] HTTP 404</h4>
                        <p className="text-sm text-gray-600 mb-3">触发一个 404 Not Found 错误</p>
                        <button
                            onClick={testHTTP404}
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
                        <h4 className="font-semibold mb-2">[2] HTTP 500</h4>
                        <p className="text-sm text-gray-600 mb-3">触发一个 500 Server Error 错误</p>
                        <button
                            onClick={testHTTP500}
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
                        <h4 className="font-semibold mb-2">[3] 图片加载错误</h4>
                        <p className="text-sm text-gray-600 mb-3">触发图片资源加载失败</p>
                        <button
                            onClick={testResourceError}
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
                        <h4 className="font-semibold mb-2">[4] 脚本加载错误</h4>
                        <p className="text-sm text-gray-600 mb-3">触发脚本资源加载失败</p>
                        <button
                            onClick={testScriptError}
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
                </div>

                {currentStep === 4 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-500 rounded">
                        <p className="text-green-700 font-semibold">所有测试步骤已完成，请打开 Network 面板检查以下请求：</p>
                        <ul className="mt-2 text-sm text-green-700 space-y-1">
                            <li>- /critical - 应该有 4 个请求（404、500、图片错误、脚本错误）</li>
                            <li>- 每个请求应该包含错误详情（URL、状态码、错误消息）</li>
                        </ul>
                    </div>
                )}
            </div>

            <TestResults results={results} />
        </div>
    )
}
