import { Component, ErrorInfo, ReactNode } from 'react'
import { captureEvent } from '@sky-monitor/monitor-sdk-core'
import type { DeviceInfo, NetworkInfo } from '@sky-monitor/monitor-sdk-browser'
import { collectDeviceInfo, collectNetworkInfo, generateErrorFingerprint } from '@sky-monitor/monitor-sdk-browser'

import { ErrorBoundaryProps, ReactErrorEvent } from './types'

interface ErrorBoundaryState {
    hasError: boolean
    error?: Error
    errorInfo?: ErrorInfo
}

/**
 * React 错误边界组件
 * 捕获子组件树中的渲染错误
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    private deviceInfo?: DeviceInfo
    private networkInfo?: NetworkInfo

    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = {
            hasError: false,
        }

        // 收集设备和网络信息
        this.deviceInfo = collectDeviceInfo()
        this.networkInfo = collectNetworkInfo()
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error,
        }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({
            error,
            errorInfo,
        })

        // 上报错误到 Sky Monitor
        this.captureReactError(error, errorInfo)

        // 调用用户自定义的 onError 回调
        if (this.props.onError) {
            this.props.onError(error, errorInfo)
        }
    }

    /**
     * 捕获 React 错误并上报
     */
    private captureReactError(error: Error, errorInfo: ErrorInfo): void {
        const componentStack = errorInfo.componentStack || ''
        const componentName = this.extractComponentName(componentStack)

        // 生成错误指纹
        const fingerprint = generateErrorFingerprint(error, error.message, 'react')

        const event: ReactErrorEvent = {
            type: 'error',
            framework: 'react',
            message: `[React Error] ${error.message}`,
            stack: error.stack,
            path: window.location.pathname,
            timestamp: new Date().toISOString(),
            errorFingerprint: fingerprint,
            reactError: {
                componentName,
                componentStack: componentStack.slice(0, 500), // 限制长度
                errorBoundary: this.constructor.name,
            },
            device: this.deviceInfo,
            network: this.networkInfo,
        }

        captureEvent(event)
    }

    /**
     * 从组件堆栈中提取组件名称
     */
    private extractComponentName(componentStack: string): string | undefined {
        const match = componentStack.match(/at (\w+)/)
        return match ? match[1] : undefined
    }

    /**
     * 渲染降级 UI
     */
    private renderFallback(): ReactNode {
        const { fallback } = this.props
        const { error, errorInfo } = this.state

        if (!fallback) {
            return (
                <div style={{ padding: '20px', border: '1px solid #f5222d', borderRadius: '4px', backgroundColor: '#fff2f0' }}>
                    <h2 style={{ color: '#f5222d' }}>Something went wrong</h2>
                    <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
                        <summary>Error Details</summary>
                        <p>{error?.toString()}</p>
                        {errorInfo && <pre>{errorInfo.componentStack}</pre>}
                    </details>
                </div>
            )
        }

        if (typeof fallback === 'function' && error && errorInfo) {
            return fallback(error, errorInfo)
        }

        return fallback as ReactNode
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return this.renderFallback()
        }

        return this.props.children
    }
}
