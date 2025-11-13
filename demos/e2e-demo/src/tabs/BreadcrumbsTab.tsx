import React, { useState } from 'react'
import { TestResults } from '../components/TestResults'
import { type TestResult } from '../types'
import { addBreadcrumb, getSDKClient } from '../sdk'
import { ReplayPlayer } from '../components/ReplayPlayer'

export const BreadcrumbsTab: React.FC = () => {
    const [results, setResults] = useState<TestResult[]>([])
    const [currentStep, setCurrentStep] = useState(0)
    const [replayEvents, setReplayEvents] = useState<any[]>([])
    const [showReplay, setShowReplay] = useState(false)

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
        setCurrentStep(prev => Math.min(prev + 1, 7))
    }

    const resetTest = () => {
        setResults([])
        setCurrentStep(0)
        addResult('info', '测试已重置，请按步骤开始测试')
    }

    const testManualBreadcrumb = () => {
        addResult('info', '步骤 1: 添加手动 Breadcrumb...')
        addBreadcrumb({
            category: 'manual',
            message: '用户点击了测试按钮',
            level: 'info',
            data: { buttonId: 'test-manual-breadcrumb' },
        })
        addResult('success', '手动 Breadcrumb 已添加')
        addResult('info', 'Breadcrumb 会附加到下一个错误事件中')
        nextStep()
    }

    const testConsoleBreadcrumb = () => {
        addResult('info', '步骤 2: 触发 Console Breadcrumb...')
        console.log('这是一条测试日志')
        console.warn('这是一条警告日志')
        console.error('这是一条错误日志')
        addResult('success', 'Console Breadcrumb 已自动采集')
        addResult('info', 'BreadcrumbIntegration 拦截了 console 方法')
        nextStep()
    }

    const testDOMBreadcrumb = () => {
        addResult('info', '步骤 3: 触发 DOM Breadcrumb...')
        const button = document.createElement('button')
        button.textContent = '测试按钮'
        button.onclick = () => {
            addResult('success', 'DOM 点击事件已自动采集')
            addResult('info', 'BreadcrumbIntegration 监听了 DOM 点击事件')
            nextStep()
        }
        button.click()
    }

    const testFetchBreadcrumb = async () => {
        addResult('info', '步骤 4: 触发 Fetch Breadcrumb...')
        try {
            await fetch('https://jsonplaceholder.typicode.com/posts/1')
            addResult('success', 'Fetch 请求已自动采集')
            addResult('info', 'BreadcrumbIntegration 拦截了 fetch 方法')
            nextStep()
        } catch (error) {
            addResult('error', 'Fetch 请求失败', error)
        }
    }

    const testHistoryBreadcrumb = () => {
        addResult('info', '步骤 5: 触发 History Breadcrumb...')
        window.history.pushState({}, '', '/test-route')
        window.history.back()
        addResult('success', 'History 变化已自动采集')
        addResult('info', 'BreadcrumbIntegration 监听了 popstate 事件')
        nextStep()
    }

    const testXHRBreadcrumb = () => {
        addResult('info', '步骤 6: 触发 XHR Breadcrumb...')
        const xhr = new XMLHttpRequest()
        xhr.open('GET', 'https://jsonplaceholder.typicode.com/posts/1')
        xhr.onload = () => {
            addResult('success', 'XHR 请求已自动采集')
            addResult('info', 'BreadcrumbIntegration 拦截了 XMLHttpRequest')
            nextStep()
        }
        xhr.send()
    }

    const testErrorWithBreadcrumbs = () => {
        addResult('info', '步骤 7: 触发错误,测试 Breadcrumb 附加...')
        addResult('info', '错误将在 1 秒后触发,同时会触发 Session Replay 上报 (10秒后)')

        setTimeout(() => {
            try {
                // 触发一个错误
                throw new Error('测试错误: Breadcrumb 应该附加到此错误事件中')
            } catch (error) {
                // 手动捕获并上报错误
                addResult('error', '错误已触发', error)
                addResult('success', '错误事件已上报到 /critical 端点')
                addResult('info', '查看错误事件的 breadcrumbs 字段,应包含前面6个步骤的所有 Breadcrumb')
                addResult('info', 'Session Replay 将在 10 秒后上报到 /replay 端点')
                addResult('info', 'Replay 数据包含: 错误前60秒 + 错误后10秒的完整录制')
                nextStep()

                // 重新抛出错误,让 SDK 捕获
                throw error
            }
        }, 1000)
    }

    const loadReplayEvents = () => {
        const client = getSDKClient()
        if (!client) {
            addResult('error', 'SDK 未初始化')
            return
        }

        const replayIntegration = client.getIntegration('SessionReplay')
        if (!replayIntegration) {
            addResult('error', 'SessionReplayIntegration 未启用')
            return
        }

        const events = replayIntegration.getRecordedEvents()
        const status = replayIntegration.getRecordingStatus()

        setReplayEvents(events)
        setShowReplay(true)

        addResult('info', `录制状态: ${status.isRecording ? '录制中' : '未录制'}`)
        addResult('info', `事件数量: ${status.eventsCount}`)
        addResult('info', `录制时长: ${status.duration}秒`)
        addResult('success', '已加载 Replay 事件，请查看下方播放器')
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Breadcrumbs 测试</h2>
                <p className="text-gray-600">测试 BreadcrumbIntegration 的用户行为轨迹采集功能</p>
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
                            <div className="font-semibold">手动添加 Breadcrumb</div>
                            <div className="text-gray-600">使用 addBreadcrumb API 手动添加用户行为轨迹</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 2 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 2 ? '[完成]' : '[2]'} 步骤 2</span>
                        <div>
                            <div className="font-semibold">Console 日志采集</div>
                            <div className="text-gray-600">自动拦截 console.log/warn/error 并记录为 Breadcrumb</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 3 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 3 ? '[完成]' : '[3]'} 步骤 3</span>
                        <div>
                            <div className="font-semibold">DOM 交互采集</div>
                            <div className="text-gray-600">自动监听 DOM 点击事件并记录为 Breadcrumb</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 4 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 4 ? '[完成]' : '[4]'} 步骤 4</span>
                        <div>
                            <div className="font-semibold">Fetch 请求采集</div>
                            <div className="text-gray-600">自动拦截 fetch API 并记录请求信息为 Breadcrumb</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 5 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 5 ? '[完成]' : '[5]'} 步骤 5</span>
                        <div>
                            <div className="font-semibold">History 变化采集</div>
                            <div className="text-gray-600">自动监听 popstate 事件，记录 SPA 路由变化</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 6 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 6 ? '[完成]' : '[6]'} 步骤 6</span>
                        <div>
                            <div className="font-semibold">XHR 请求采集</div>
                            <div className="text-gray-600">自动拦截 XMLHttpRequest 并记录请求信息为 Breadcrumb</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 7 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 7 ? '[完成]' : '[7]'} 步骤 7</span>
                        <div>
                            <div className="font-semibold">触发错误,测试 Breadcrumb 附加</div>
                            <div className="text-gray-600">触发错误事件,验证前面6个步骤的 Breadcrumb 是否附加到错误事件中</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 数据流说明 */}
            <div className="border border-gray-300 p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">数据流说明</h3>
                <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">1. 采集</span>
                        <span>BreadcrumbIntegration 拦截各种用户行为（点击、请求、日志等）</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">2. 存储</span>
                        <span>Breadcrumb 存储在内存中，最多保留 100 条（FIFO）</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">3. 附加</span>
                        <span>当错误发生时，Breadcrumb 会附加到错误事件的 breadcrumbs 字段中</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">4. 上报</span>
                        <span>Breadcrumb 随错误事件一起上报到 /critical 端点</span>
                    </div>
                </div>
            </div>

            {/* 测试按钮 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">测试操作（请按顺序点击）</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`border p-4 ${currentStep === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[1] 手动添加</h4>
                        <p className="text-sm text-gray-600 mb-3">使用 addBreadcrumb 手动添加面包屑</p>
                        <button
                            onClick={testManualBreadcrumb}
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
                        <h4 className="font-semibold mb-2">[2] Console 日志</h4>
                        <p className="text-sm text-gray-600 mb-3">自动采集 console.log/warn/error</p>
                        <button
                            onClick={testConsoleBreadcrumb}
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
                        <h4 className="font-semibold mb-2">[3] DOM 交互</h4>
                        <p className="text-sm text-gray-600 mb-3">自动采集 DOM 点击事件</p>
                        <button
                            onClick={testDOMBreadcrumb}
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
                        <h4 className="font-semibold mb-2">[4] Fetch 请求</h4>
                        <p className="text-sm text-gray-600 mb-3">自动采集 Fetch API 请求</p>
                        <button
                            onClick={testFetchBreadcrumb}
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
                        <h4 className="font-semibold mb-2">[5] History 变化</h4>
                        <p className="text-sm text-gray-600 mb-3">自动采集路由变化（SPA）</p>
                        <button
                            onClick={testHistoryBreadcrumb}
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

                    <div className={`border p-4 ${currentStep === 5 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[6] XHR 请求</h4>
                        <p className="text-sm text-gray-600 mb-3">自动采集 XMLHttpRequest 请求</p>
                        <button
                            onClick={testXHRBreadcrumb}
                            className={`w-full px-4 py-2 font-medium transition-colors ${
                                currentStep === 5
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={currentStep !== 5}
                        >
                            {currentStep > 5 ? '已完成' : currentStep < 5 ? '等待步骤 5' : '点击测试'}
                        </button>
                    </div>

                    <div className={`border p-4 ${currentStep === 6 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[7] 触发错误</h4>
                        <p className="text-sm text-gray-600 mb-3">触发错误,测试 Breadcrumb 附加到错误事件</p>
                        <button
                            onClick={testErrorWithBreadcrumbs}
                            className={`w-full px-4 py-2 font-medium transition-colors ${
                                currentStep === 6
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={currentStep !== 6}
                        >
                            {currentStep > 6 ? '已完成' : currentStep < 6 ? '等待步骤 6' : '点击触发错误'}
                        </button>
                    </div>
                </div>

                {currentStep === 7 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-500 rounded">
                        <p className="text-green-700 font-semibold">所有测试步骤已完成，错误已触发并上报</p>
                        <ul className="mt-2 text-sm text-green-700 space-y-1">
                            <li>- 错误事件已上报到 /critical 端点,包含前面6个步骤的所有 Breadcrumb</li>
                            <li>- Session Replay 将在 10 秒后上报到 /replay 端点</li>
                            <li>- Replay 数据包含: 错误前60秒 + 错误后10秒的完整录制</li>
                            <li>- 打开 Network 面板,查看 /critical 和 /replay 请求</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Session Replay 播放器 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">Session Replay 播放器</h3>
                <p className="text-sm text-gray-600 mb-4">查看录制的会话回放，验证敏感信息是否被正确隐藏</p>

                <button
                    onClick={loadReplayEvents}
                    className="mb-4 px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                    加载 Replay 事件
                </button>

                {showReplay && (
                    <div className="mt-4">
                        <ReplayPlayer events={replayEvents} width={1024} height={600} />
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-500 rounded">
                            <p className="text-yellow-800 font-semibold mb-2">验证敏感信息隐藏:</p>
                            <ul className="text-sm text-yellow-700 space-y-1">
                                <li>- 所有 input 输入框应该显示为 ***（maskAllInputs: true）</li>
                                <li>- password 类型的输入框应该被完全隐藏</li>
                                <li>- 带有 sky-monitor-mask 类名的元素文本应该被脱敏</li>
                                <li>- 带有 sky-monitor-block 类名的元素不应该被录制</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* 测试结果 */}
            <TestResults results={results} />
        </div>
    )
}
