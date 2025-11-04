import type { ErrorEvent } from '@sky-monitor/monitor-sdk-core'
import type { DeviceInfo, NetworkInfo, ErrorFingerprint } from '@sky-monitor/monitor-sdk-browser'
import { ReactNode, ErrorInfo } from 'react'

/**
 * React 错误详情
 */
export interface ReactErrorDetails {
    componentName?: string
    componentStack?: string
    errorBoundary?: string
}

/**
 * React 错误事件
 */
export interface ReactErrorEvent extends ErrorEvent {
    framework: 'react'
    path?: string
    reactError?: ReactErrorDetails
    device?: DeviceInfo
    network?: NetworkInfo
    errorFingerprint?: ErrorFingerprint
}

/**
 * ErrorBoundary 配置
 */
export interface ErrorBoundaryProps {
    fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode)
    onError?: (error: Error, errorInfo: ErrorInfo) => void
    showDialog?: boolean
    children: ReactNode
}
