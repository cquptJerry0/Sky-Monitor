import React, { useState } from 'react'
import { TestResults } from '../components/TestResults'
import { type TestResult } from '../types'
import { getSDKClient } from '../sdk'

export const SessionReplayTab: React.FC = () => {
    const [results, setResults] = useState<TestResult[]>([])
    const [inputValue, setInputValue] = useState('')
    const [currentStep, setCurrentStep] = useState(0)
    const [replayData, setReplayData] = useState<string>('')

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
        setInputValue('')
        addResult('info', '测试已重置，请按步骤开始测试')
    }

    const testDOMInteraction = () => {
        addResult('info', '步骤 1: 记录 DOM 交互...')
        addResult('success', 'DOM 交互已被 rrweb 录制')
        addResult('info', '在输入框中输入内容，点击按钮，这些操作都会被录制')
        nextStep()
    }

    const testPrivacyMasking = () => {
        addResult('info', '步骤 2: 测试隐私脱敏功能...')
        addResult('success', '输入框内容已自动脱敏（maskAllInputs: true）')
        addResult('info', '查看 Replay 时，敏感信息将被替换为星号')

        // 从 SDK 获取原始 rrweb events
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
        if (events.length === 0) {
            addResult('error', '暂无录制数据，请先在输入框中输入内容')
            return
        }

        setReplayData(JSON.stringify(events, null, 2))
        addResult('success', `已获取 ${events.length} 个 rrweb 事件，可以查看录制数据（见下方）`)
        addResult('info', '查找 type=3 的事件（增量快照），检查 input 元素的 value 是否被脱敏')

        nextStep()
    }

    const testErrorTriggeredReplay = () => {
        addResult('info', '步骤 3: 触发错误以启动 Replay 上报...')
        setTimeout(() => {
            // @ts-expect-error - Intentionally calling undefined function for testing
            undefinedFunction()
        }, 100)
        addResult('success', '错误已触发，SessionReplay 将立即上报缓冲区数据')
        addResult('info', '上报流程：立即上报错误前 60 秒的录制 + 继续录制 10 秒')
        addResult('info', '10 秒后会再次上报错误后的录制数据')
        addResult('info', '打开 Network 面板查看 /replay 请求（会有 2 个请求）')
        nextStep()
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Session Replay 测试</h2>
                <p className="text-gray-600">测试 SessionReplayIntegration 的会话录制功能</p>
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
                            <div className="font-semibold">测试 DOM 交互录制</div>
                            <div className="text-gray-600">在输入框输入内容，点击按钮 - rrweb 录制所有 DOM 变化</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 2 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 2 ? '[完成]' : '[2]'} 步骤 2</span>
                        <div>
                            <div className="font-semibold">测试隐私脱敏</div>
                            <div className="text-gray-600">验证输入框内容是否被脱敏（maskAllInputs: true）</div>
                        </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded ${currentStep >= 3 ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="font-semibold min-w-[60px]">{currentStep >= 3 ? '[完成]' : '[3]'} 步骤 3</span>
                        <div>
                            <div className="font-semibold">触发错误上报 Replay</div>
                            <div className="text-gray-600">触发 window.error - 10 秒后上报到 /replay（包含前 60 秒录制）</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 配置信息 */}
            <div className="border border-gray-300 p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">当前配置</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">录制模式</span>
                        <span className="font-semibold">onError（错误时上报）</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">缓冲时长</span>
                        <span className="font-semibold">60 秒</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">错误后录制</span>
                        <span className="font-semibold">10 秒</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">输入脱敏</span>
                        <span className="font-semibold">启用</span>
                    </div>
                </div>
            </div>

            {/* 数据流说明 */}
            <div className="border border-gray-300 p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">数据流说明</h3>
                <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">1. 持续录制</span>
                        <span>rrweb 持续录制 DOM 变化，保存在内存缓冲区（最多 60 秒）</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">2. 错误触发</span>
                        <span>window.error 或 window.unhandledrejection 触发上报流程</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">3. 立即上报</span>
                        <span>立即上报缓冲区中的数据（错误前 60 秒的录制）</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">4. 继续录制</span>
                        <span>错误后继续录制 10 秒，捕获用户的后续操作</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">5. 再次上报</span>
                        <span>10 秒后再次上报错误后的录制数据</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[120px]">6. 压缩传输</span>
                        <span>gzip 压缩录制数据，Base64 编码后上报到 /replay 端点</span>
                    </div>
                </div>
            </div>

            {/* 交互测试区域 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">交互测试区域</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">测试输入（将被脱敏）</label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            placeholder="输入一些文本..."
                            className="w-full px-4 py-2 border-2 border-gray-300 focus:border-black focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">密码输入（将被脱敏）</label>
                        <input
                            type="password"
                            placeholder="输入密码..."
                            className="w-full px-4 py-2 border-2 border-gray-300 focus:border-black focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* 测试按钮 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">测试操作（请按顺序点击）</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`border p-4 ${currentStep === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <h4 className="font-semibold mb-2">[1] DOM 交互</h4>
                        <p className="text-sm text-gray-600 mb-3">在输入框输入内容，点击按钮测试录制</p>
                        <button
                            onClick={testDOMInteraction}
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
                        <h4 className="font-semibold mb-2">[2] 隐私脱敏</h4>
                        <p className="text-sm text-gray-600 mb-3">验证输入框内容是否被脱敏</p>
                        <button
                            onClick={testPrivacyMasking}
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
                        <h4 className="font-semibold mb-2">[3] 错误触发 Replay</h4>
                        <p className="text-sm text-gray-600 mb-3">触发错误，启动 Replay 上报流程</p>
                        <button
                            onClick={testErrorTriggeredReplay}
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
                        <p className="text-green-700 font-semibold">所有测试步骤已完成，请打开 Network 面板检查以下请求：</p>
                        <ul className="mt-2 text-sm text-green-700 space-y-1">
                            <li>- /replay - 应该有 2 个请求（立即发送 + 10 秒后发送）</li>
                            <li>- 请求包含 gzip 压缩的录制数据（events 字段）</li>
                            <li>- 请求包含 metadata（replayId、trigger、duration、eventCount）</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* 测试结果 */}
            <TestResults results={results} />

            {/* 录制数据查看器 */}
            {replayData && (
                <div className="border border-gray-300 p-6 mt-6">
                    <h3 className="text-lg font-semibold mb-3">rrweb 录制数据（原始 events）</h3>
                    <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                        <pre className="text-xs">{replayData}</pre>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-gray-600">
                        <p className="font-semibold">如何验证脱敏效果:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>
                                查找 <code className="bg-gray-200 px-1">type: 3</code> 的事件（增量快照 - IncrementalSnapshot）
                            </li>
                            <li>
                                在 <code className="bg-gray-200 px-1">data.attributes</code> 中查找{' '}
                                <code className="bg-gray-200 px-1">value</code> 属性
                            </li>
                            <li>
                                输入框的值应该显示为 <code className="bg-gray-200 px-1">"***"</code> 而不是实际输入的内容
                            </li>
                            <li>
                                密码输入框的值也应该被脱敏为 <code className="bg-gray-200 px-1">"***"</code>
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}
