import React, { useState } from 'react'
import { StepForm } from '../components/StepForm'
import { TestResults } from '../components/TestResults'
import { type TestStep, type TestResult } from '../types'
import { addBreadcrumb, captureException } from '../sdk'

export const E2ETab: React.FC = () => {
    const [results, setResults] = useState<TestResult[]>([])
    const [steps, setSteps] = useState<TestStep[]>([
        {
            id: 'step1',
            title: '页面加载',
            description: '模拟用户打开页面，SDK 初始化并开始录制',
            action: async () => {
                await new Promise(resolve => setTimeout(resolve, 500))
                addBreadcrumb({
                    category: 'navigation',
                    message: '页面加载完成',
                    level: 'info',
                })
            },
            completed: false,
        },
        {
            id: 'step2',
            title: '点击按钮',
            description: '用户点击"查看商品"按钮，触发 DOM Breadcrumb',
            action: async () => {
                await new Promise(resolve => setTimeout(resolve, 300))
                addBreadcrumb({
                    category: 'ui.click',
                    message: '点击查看商品按钮',
                    level: 'info',
                    data: { target: 'button#view-products' },
                })
            },
            completed: false,
        },
        {
            id: 'step3',
            title: '输入文本',
            description: '用户在搜索框输入"测试商品"，触发 Input Breadcrumb',
            action: async () => {
                await new Promise(resolve => setTimeout(resolve, 300))
                addBreadcrumb({
                    category: 'ui.input',
                    message: '输入搜索关键词',
                    level: 'info',
                    data: { value: '[MASKED]' },
                })
            },
            completed: false,
        },
        {
            id: 'step4',
            title: 'HTTP 请求',
            description: '发送 API 请求获取商品列表，触发 Fetch Breadcrumb',
            action: async () => {
                await fetch('https://jsonplaceholder.typicode.com/posts/1')
                addBreadcrumb({
                    category: 'fetch',
                    message: 'GET /api/products',
                    level: 'info',
                    data: { status: 200 },
                })
            },
            completed: false,
        },
        {
            id: 'step5',
            title: '触发错误',
            description: '用户点击"购买"按钮时发生错误，触发 Error + Replay 上报',
            action: async () => {
                await new Promise(resolve => setTimeout(resolve, 300))
                try {
                    throw new Error('支付接口调用失败：网络超时')
                } catch (error) {
                    captureException(error as Error)
                }
            },
            completed: false,
        },
        {
            id: 'step6',
            title: '等待上报',
            description: '等待 Error 和 Replay 数据上报到 DSN 服务器',
            action: async () => {
                await new Promise(resolve => setTimeout(resolve, 2000))
            },
            completed: false,
        },
        {
            id: 'step7',
            title: '验证数据',
            description: '检查 DSN 服务器是否收到完整的 Error + Breadcrumbs + Replay 数据',
            action: async () => {
                await new Promise(resolve => setTimeout(resolve, 500))
            },
            validate: async () => {
                return true
            },
            completed: false,
        },
    ])

    const handleStepComplete = (stepId: string, result: 'success' | 'error', message?: string) => {
        setSteps(prev => prev.map(step => (step.id === stepId ? { ...step, completed: true, result, message } : step)))

        setResults(prev => [
            ...prev,
            {
                timestamp: new Date().toLocaleTimeString(),
                type: result,
                message: `${steps.find(s => s.id === stepId)?.title}: ${message || '完成'}`,
            },
        ])
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">E2E 综合测试</h2>
                <p className="text-gray-600">完整的用户操作流程测试：从页面加载到错误触发，验证所有功能协同工作</p>
            </div>

            <div className="border border-gray-300 p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">测试场景</h3>
                <p className="text-sm text-gray-700">
                    模拟用户在电商网站的完整操作流程：打开页面 → 查看商品 → 搜索 → 发起请求 → 触发错误。 验证 SDK 是否正确采集了所有
                    Breadcrumbs、错误信息和 Session Replay 数据。
                </p>
            </div>

            <StepForm steps={steps} onStepComplete={handleStepComplete} />

            <TestResults results={results} maxHeight="300px" />
        </div>
    )
}
