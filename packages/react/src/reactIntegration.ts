import { ComponentType, createElement } from 'react'
import { Integration } from '@sky-monitor/monitor-sdk-core'

import { ErrorBoundary } from './ErrorBoundary'
import { ErrorBoundaryProps } from './types'

/**
 * React Integration
 * 提供工具函数，如 withErrorBoundary HOC
 */
export class ReactIntegration implements Integration {
    name = 'ReactIntegration'
    priority = 40 // 优先级：在错误采集和采样之后执行

    /**
     * 全局初始化
     */
    setupOnce(): void {
        // React 错误边界是声明式的，主要通过组件使用
        // 这里可以添加 React 环境检测
        this.detectReactEnvironment()
    }

    /**
     * 检测 React 环境
     */
    private detectReactEnvironment(): void {
        if (typeof window === 'undefined') return

        try {
            // 检测 React DevTools
            const hasReactDevTools = '__REACT_DEVTOOLS_GLOBAL_HOOK__' in window

            // 检测 React 版本（如果可用）
            const reactVersion = this.getReactVersion()

            // 可以将这些信息添加到全局上下文
            if (reactVersion || hasReactDevTools) {
                // 这里可以记录 React 环境信息
                console.debug('[Sky Monitor] React environment detected', {
                    version: reactVersion,
                    hasDevTools: hasReactDevTools,
                })
            }
        } catch (error) {
            // 忽略检测错误
        }
    }

    /**
     * 获取 React 版本
     */
    private getReactVersion(): string | undefined {
        try {
            // 尝试从多个可能的位置获取 React 版本
            if (typeof window !== 'undefined') {
                const root = document.querySelector('[data-reactroot], [data-reactid]')
                if (root) {
                    // React 挂载的元素通常会有版本信息
                    return 'detected'
                }
            }
            return undefined
        } catch {
            return undefined
        }
    }
}

/**
 * Higher-Order Component
 * 自动包装组件使用 ErrorBoundary
 *
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   fallback: <div>Error occurred</div>,
 *   onError: (error, errorInfo) => {
 *     console.error('Component error:', error)
 *   }
 * })
 * ```
 */
export function withErrorBoundary<P extends object>(
    Component: ComponentType<P>,
    errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): ComponentType<P> {
    const WrappedComponent: ComponentType<P> = (props: P) => {
        const componentElement = createElement(Component, props)
        const boundaryProps = {
            ...errorBoundaryProps,
            children: componentElement,
        }
        return createElement(ErrorBoundary, boundaryProps)
    }

    // 保留组件名称，方便调试
    const componentDisplayName = Component.displayName || Component.name || 'Component'
    WrappedComponent.displayName = `withErrorBoundary(${componentDisplayName})`

    return WrappedComponent
}
