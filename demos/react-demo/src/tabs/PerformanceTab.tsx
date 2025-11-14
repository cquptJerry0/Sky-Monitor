import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TestResults } from '../components/TestResults'
import { type TestResult } from '../types'

export const PerformanceTab: React.FC = () => {
    const navigate = useNavigate()
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

    const testWebVitals = () => {
        addResult('info', '步骤 1: 查看 Web Vitals 指标...')
        addResult('success', 'Web Vitals 集成已启动（监听 6 个核心指标）')
        addResult('info', '已上报: FCP, TTFB, LCP（页面加载时自动上报）')
        addResult('info', '待上报: FID（需要首次交互）, CLS/INP（需要页面隐藏）')
        addResult('info', '注意: 刷新页面后只会看到 FCP, TTFB, LCP 三个指标')
        addResult('info', '打开 Network 面板查看 /batch 请求中的 Web Vitals 事件')
        nextStep()
    }

    const triggerCLSAndINP = () => {
        addResult('info', '步骤 4: 触发 CLS 和 INP 上报...')
        addResult('info', '切换到其他 Tab 页面，然后再切换回来')
        addResult('info', '页面隐藏时会触发 CLS 和 INP 的上报')
        addResult('success', '请切换到 "Overview" Tab，然后再切换回 "Performance" Tab')
        addResult('info', '切换后查看 Network 面板的 /batch 请求，应该包含 CLS 和 INP')
        nextStep()
    }

    const openPerformanceTestPage = () => {
        addResult('info', '步骤 2: 跳转到性能测试页面...')
        addResult('success', '正在跳转到性能测试页面')
        addResult('info', '在新页面中测试路由切换时的 Web Vitals 采集')
        addResult('info', '测试完成后点击返回按钮，回到这里继续测试')

        // 使用 React Router 跳转
        setTimeout(() => {
            navigate('/performance')
        }, 500)

        nextStep()
    }

    const testSlowRequest = async () => {
        addResult('info', '步骤 3: 触发慢请求（>3秒）...')
        try {
            await fetch('https://httpbin.org/delay/4')
            addResult('success', '慢请求已完成，PerformanceIntegration 已采集性能数据')
            addResult('info', 'HTTP 请求性能数据将上报到 /batch')
            nextStep()
        } catch (error) {
            addResult('error', '请求失败', error)
        }
    }

    const testResourceTiming = () => {
        addResult('info', '步骤 3: 加载资源并采集性能数据...')
        const img = new Image()
        img.onload = () => {
            addResult('success', '资源加载完成，ResourceTimingIntegration 已采集性能数据')
            addResult('info', '资源性能数据将上报到 /batch')
            nextStep()
        }
        img.onerror = () => {
            addResult('error', '资源加载失败，但 ResourceTimingIntegration 仍会记录失败的资源')
            addResult('info', '资源性能数据将上报到 /batch')
            nextStep()
        }
        // 使用可靠的图片源
        img.src = 'https://picsum.photos/150/150?' + Date.now()
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">性能监控测试</h2>
                <p className="text-gray-600">测试 Metrics、PerformanceIntegration 和 ResourceTimingIntegration</p>
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
                            <div className="font-semibold">查看 Web Vitals 指标</div>
                            <div className="text-gray-600">已上报: FCP、TTFB、LCP（3个）| 待上报: FID、CLS、INP（需交互/隐藏）</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 2 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 2 ? '[完成]' : '[2]'} 步骤 2</span>
                        <div>
                            <div className="font-semibold">跳转到性能测试页面</div>
                            <div className="text-gray-600">使用 React Router 跳转 - 测试路由切换时的 Web Vitals 采集</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 3 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 3 ? '[完成]' : '[3]'} 步骤 3</span>
                        <div>
                            <div className="font-semibold">触发慢请求</div>
                            <div className="text-gray-600">发送 4 秒延迟请求 - PerformanceIntegration 采集 HTTP 性能 - 上报到 /batch</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 4 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 4 ? '[完成]' : '[4]'} 步骤 4</span>
                        <div>
                            <div className="font-semibold">加载资源</div>
                            <div className="text-gray-600">加载图片资源 - ResourceTimingIntegration 采集资源性能 - 上报到 /batch</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 5 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 5 ? '[完成]' : '[5]'} 步骤 5</span>
                        <div>
                            <div className="font-semibold">触发 CLS 和 INP 上报</div>
                            <div className="text-gray-600">切换 Tab 页面触发页面隐藏事件 - CLS 和 INP 上报到 /batch</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 数据流说明 */}
            <div className="border border-gray-300 p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">数据流说明</h3>
                <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">1. Web Vitals</span>
                        <span>Metrics Integration 自动采集 6 个核心指标</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[140px]">- FCP/TTFB/LCP</span>
                        <span>页面加载时自动上报</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[140px]">- FID</span>
                        <span>首次用户交互后上报（点击、按键等）</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[140px]">- CLS</span>
                        <span>等待 FCP 后开始计算，页面隐藏时上报</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[140px]">- INP</span>
                        <span>需要用户交互，页面隐藏时上报</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">2. HTTP 性能</span>
                        <span>PerformanceIntegration 拦截 fetch/XHR，记录请求时长、状态码等</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">3. 资源性能</span>
                        <span>ResourceTimingIntegration 使用 PerformanceObserver 监听资源加载</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">4. 面包屑附加</span>
                        <span>Scope 会将面包屑（breadcrumbs）附加到所有事件，包括性能事件</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">5. 批量上报</span>
                        <span>性能事件达到 20 个或 5 秒后批量发送到 /batch 端点</span>
                    </div>
                </div>
            </div>

            {/* 测试按钮 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">测试操作（请按顺序点击）</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`border p-4 ${currentStep === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[1] Web Vitals</h4>
                        <p className="text-sm text-gray-600 mb-3">查看 Core Web Vitals 指标</p>
                        <button
                            onClick={testWebVitals}
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
                        <h4 className="font-semibold mb-2">[2] 性能测试页面</h4>
                        <p className="text-sm text-gray-600 mb-3">跳转到性能测试页面</p>
                        <button
                            onClick={openPerformanceTestPage}
                            className={`w-full px-4 py-2 font-medium transition-colors ${
                                currentStep === 1
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={currentStep !== 1}
                        >
                            {currentStep > 1 ? '已完成' : currentStep < 1 ? '等待步骤 1' : '跳转到测试页面'}
                        </button>
                    </div>

                    <div className={`border p-4 ${currentStep === 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[3] 慢请求监控</h4>
                        <p className="text-sm text-gray-600 mb-3">触发一个超过 3 秒的请求</p>
                        <button
                            onClick={testSlowRequest}
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
                        <h4 className="font-semibold mb-2">[4] 资源性能</h4>
                        <p className="text-sm text-gray-600 mb-3">加载资源并采集性能数据</p>
                        <button
                            onClick={testResourceTiming}
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
                        <h4 className="font-semibold mb-2">[5] CLS & INP</h4>
                        <p className="text-sm text-gray-600 mb-3">切换 Tab 触发页面隐藏事件</p>
                        <button
                            onClick={triggerCLSAndINP}
                            className={`w-full px-4 py-2 font-medium transition-colors ${
                                currentStep === 4
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={currentStep !== 4}
                        >
                            {currentStep > 4 ? '已完成' : currentStep < 4 ? '等待步骤 4' : '点击测试'}
                        </button>
                    </div>
                </div>

                {currentStep === 4 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-500 rounded">
                        <p className="text-green-700 font-semibold">所有测试步骤已完成，请打开 Network 面板检查以下请求：</p>
                        <ul className="mt-2 text-sm text-green-700 space-y-1">
                            <li>- /batch - 应该包含 Web Vitals 事件（type: webVital）</li>
                            <li>- /batch - 应该包含 HTTP 性能事件（type: performance, category: http）</li>
                            <li>- /batch - 应该包含资源性能事件（type: performance, category: resourceTiming）</li>
                            <li>- 切换到 Overview Tab 再切换回来后，应该看到 CLS 和 INP 事件</li>
                        </ul>
                    </div>
                )}
            </div>

            <TestResults results={results} />
        </div>
    )
}
