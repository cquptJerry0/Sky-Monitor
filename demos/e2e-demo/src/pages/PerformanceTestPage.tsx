import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TestResults } from '../components/TestResults'
import { type TestResult } from '../types'

export const PerformanceTestPage: React.FC = () => {
    const navigate = useNavigate()
    const [results, setResults] = useState<TestResult[]>([])

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

    useEffect(() => {
        addResult('info', '性能测试页面已加载')
        addResult('info', '此页面用于测试路由切换时的 Web Vitals 采集')
        addResult('info', '页面加载时会自动上报 FCP、TTFB、LCP 指标')
    }, [])

    const testRouteSwitch = () => {
        addResult('info', '准备切换路由...')
        addResult('success', '切换到主页面，观察 Web Vitals 上报')
        setTimeout(() => {
            navigate('/')
        }, 1000)
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="border-b-2 border-black">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <h1 className="text-3xl font-bold mb-2">性能测试页面</h1>
                    <p className="text-gray-600">测试路由切换时的 Web Vitals 采集</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="space-y-6">
                    <div className="border border-blue-500 p-6 bg-blue-50">
                        <h3 className="text-lg font-semibold mb-3">测试说明</h3>
                        <div className="space-y-2 text-sm">
                            <p>1. 此页面加载时会自动触发 Web Vitals 采集</p>
                            <p>2. 打开 Network 面板，查看 /batch 请求</p>
                            <p>3. 应该看到 FCP、TTFB、LCP 三个指标</p>
                            <p>4. 点击下方按钮切换回主页面，继续观察 Web Vitals 上报</p>
                        </div>
                    </div>

                    <div className="border border-gray-300 p-6">
                        <h3 className="text-lg font-semibold mb-4">测试操作</h3>
                        <div className="space-y-4">
                            <button
                                onClick={testRouteSwitch}
                                className="w-full px-4 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700"
                            >
                                切换回主页面
                            </button>
                            <button
                                onClick={() => navigate(-1)}
                                className="w-full px-4 py-3 bg-gray-600 text-white font-medium hover:bg-gray-700"
                            >
                                返回上一页
                            </button>
                        </div>
                    </div>

                    <TestResults results={results} />
                </div>
            </div>
        </div>
    )
}
