// Tab 定义
export type TabId =
    | 'overview'
    | 'e2e'
    | 'react'
    | 'errors'
    | 'breadcrumbs'
    | 'replay'
    | 'performance'
    | 'http'
    | 'batch'
    | 'offline'
    | 'advanced'

export interface Tab {
    id: TabId
    name: string
    description: string
}

// 测试步骤定义
export interface TestStep {
    id: string
    title: string
    description: string
    action: () => Promise<void> | void
    validate?: () => Promise<boolean> | boolean
    completed: boolean
    result?: 'success' | 'error'
    message?: string
}

// 测试结果
export interface TestResult {
    timestamp: string
    type: 'success' | 'error' | 'info'
    message: string
    details?: unknown
}

// SDK 状态
export interface SDKStatus {
    initialized: boolean
    integrations: string[]
    transportQueues: {
        immediate: number
        batched: number
        replay: number
    }
    stats: {
        totalEvents: number
        errors: number
        breadcrumbs: number
        replays: number
    }
}
