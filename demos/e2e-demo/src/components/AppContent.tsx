import { useState, useEffect } from 'react'
import { TabNavigation } from './TabNavigation'
import { OverviewTab } from '../tabs/OverviewTab'
import { ErrorsTab } from '../tabs/ErrorsTab'
import { BreadcrumbsTab } from '../tabs/BreadcrumbsTab'
import { SessionReplayTab } from '../tabs/SessionReplayTab'
import { PerformanceTab } from '../tabs/PerformanceTab'
import { HTTPTab } from '../tabs/HTTPTab'
import { AdvancedTab } from '../tabs/AdvancedTab'
import { BatchTab } from '../tabs/BatchTab'
import { E2ETab } from '../tabs/E2ETab'
import { type Tab, type TabId } from '../types'
import { initializeSDK } from '../sdk'
import { useApp } from '../contexts/AppContext'

const tabs: Tab[] = [
    { id: 'overview', name: 'Overview', description: 'SDK 状态概览' },
    { id: 'e2e', name: 'E2E Test', description: 'E2E 综合测试' },
    { id: 'errors', name: 'Errors', description: '错误捕获测试' },
    { id: 'breadcrumbs', name: 'Breadcrumbs', description: '用户行为轨迹' },
    { id: 'replay', name: 'Session Replay', description: '会话录制' },
    { id: 'performance', name: 'Performance', description: '性能监控' },
    { id: 'http', name: 'HTTP & Resources', description: 'HTTP 和资源错误' },
    { id: 'batch', name: 'Batch', description: '批量上报测试' },
    { id: 'advanced', name: 'Advanced', description: '高级功能' },
]

export const AppContent = () => {
    const [activeTab, setActiveTab] = useState<TabId>('overview')
    const [sdkInitialized, setSdkInitialized] = useState(false)
    const { appId } = useApp()

    useEffect(() => {
        initializeSDK(appId)
            .then(() => {
                setSdkInitialized(true)
                console.log('[App] SDK initialized successfully with appId:', appId)
            })
            .catch(error => {
                console.error('[App] SDK initialization failed:', error)
            })
    }, [appId])

    const renderTabContent = () => {
        switch (activeTab) {
            case 'e2e':
                return <E2ETab />
            case 'errors':
                return <ErrorsTab />
            case 'breadcrumbs':
                return <BreadcrumbsTab />
            case 'replay':
                return <SessionReplayTab />
            case 'performance':
                return <PerformanceTab />
            case 'http':
                return <HTTPTab />
            case 'batch':
                return <BatchTab />
            case 'advanced':
                return <AdvancedTab />
            case 'overview':
            default:
                return <OverviewTab />
        }
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b-2 border-black">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <h1 className="text-3xl font-bold mb-2">Sky Monitor - E2E Test</h1>
                    <p className="text-gray-600">完整的 Integration 测试平台 - 覆盖所有 11 个 Integration</p>
                    <div className="mt-3 flex items-center gap-3">
                        <span
                            className={`px-3 py-1 text-sm font-medium ${sdkInitialized ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'}`}
                        >
                            {sdkInitialized ? 'SDK 已初始化' : 'SDK 初始化中...'}
                        </span>
                        <span className="text-sm text-gray-500">App ID: {appId}</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-7xl mx-auto px-6">
                <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">{renderTabContent()}</div>

            {/* E2E Test Button (Fixed) */}
            <div className="fixed bottom-6 right-6">
                <button
                    onClick={() => setActiveTab('e2e')}
                    className="px-6 py-3 bg-black text-white font-semibold shadow-lg hover:bg-gray-800 transition-colors"
                    title="打开 E2E 综合测试"
                >
                    E2E 测试
                </button>
            </div>
        </div>
    )
}
