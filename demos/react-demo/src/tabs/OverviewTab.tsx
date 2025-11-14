import React, { useRef } from 'react'
import { getSDKClient } from '../sdk'
import { useApp } from '../contexts/AppContext'

export const OverviewTab: React.FC = () => {
    const client = getSDKClient()
    const initialized = Boolean(client)
    const { appId, setAppId } = useApp()
    const inputRef = useRef<HTMLInputElement>(null)
    const sdkStatus = {
        initialized,
        integrations: initialized
            ? [
                  'Errors',
                  'Metrics',
                  'BreadcrumbIntegration',
                  'SessionReplayIntegration',
                  'HttpErrorIntegration',
                  'ResourceErrorIntegration',
                  'PerformanceIntegration',
                  'SessionIntegration',
                  'ResourceTimingIntegration',
                  'SamplingIntegration',
                  'DeduplicationIntegration',
              ]
            : [],
        version: '1.0.0-e2e',
        dsn: `http://localhost:8080/api/monitoring/${appId}`,
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">SDK 状态概览</h2>
                <p className="text-gray-600">查看 Sky-Monitor SDK 的初始化状态和配置信息</p>
            </div>

            {/* SDK 状态 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">初始化状态</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">App ID</span>
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                defaultValue={appId}
                                className="w-48 px-3 py-2 border-2 border-gray-300 focus:border-black focus:outline-none"
                                placeholder="输入 App ID..."
                            />
                            <button
                                onClick={() => {
                                    if (inputRef.current) {
                                        setAppId(inputRef.current.value)
                                    }
                                }}
                                className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
                            >
                                确定
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">状态</span>
                        <span className={`font-semibold ${sdkStatus.initialized ? 'text-black' : 'text-gray-400'}`}>
                            {sdkStatus.initialized ? '已初始化' : '未初始化'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">版本</span>
                        <span className="font-semibold">{sdkStatus.version}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">DSN</span>
                        <span className="font-mono text-xs">{sdkStatus.dsn}</span>
                    </div>
                </div>
            </div>

            {/* Integrations 列表 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">
                    已加载的 Integrations ({sdkStatus.integrations.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {sdkStatus.integrations.map((integration, index) => (
                        <div key={index} className="p-3 border border-gray-300 bg-gray-50">
                            <div className="font-medium text-sm">{integration}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 传输架构 */}
            <div className="border border-gray-300 p-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">传输架构 (TransportRouter)</h3>
                <div className="space-y-3">
                    <div className="p-3 bg-gray-50 border-l-4 border-black">
                        <div className="font-semibold mb-1">Critical 通道</div>
                        <div className="text-sm text-gray-600">错误、异常 → /critical (立即发送)</div>
                    </div>
                    <div className="p-3 bg-gray-50 border-l-4 border-gray-400">
                        <div className="font-semibold mb-1">Batch 通道</div>
                        <div className="text-sm text-gray-600">WebVital、Performance、Message → /batch (批量发送)</div>
                    </div>
                    <div className="p-3 bg-gray-50 border-l-4 border-gray-400">
                        <div className="font-semibold mb-1">Replay 通道</div>
                        <div className="text-sm text-gray-600">Session Replay → /replay (专用通道)</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
