import { useEffect, useState } from 'react'

/**
 * 全局 Loading 组件
 *
 * 功能：
 * - 监听全局 loading 事件
 * - 自动显示/隐藏 loading 遮罩层
 * - 支持多个并发请求（通过计数器管理）
 *
 * 使用方式：
 * 1. 在根组件（App.tsx 或 Layout）中添加
 * 2. 请求拦截器会自动触发 loading
 * 3. 响应拦截器会自动关闭 loading
 *
 * 技术实现：
 * - 使用 CustomEvent 进行组件间通信
 * - loading 状态由 request.ts 中的计数器管理
 * - 使用 fixed 定位 + 高 z-index 覆盖全局
 */
export function GlobalLoading() {
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const handleLoading = (e: Event) => {
            const customEvent = e as CustomEvent<{ loading: boolean }>
            setLoading(customEvent.detail.loading)
        }

        window.addEventListener('globalLoading', handleLoading)
        return () => {
            window.removeEventListener('globalLoading', handleLoading)
        }
    }, [])

    if (!loading) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <span className="text-sm font-medium">加载中...</span>
                </div>
            </div>
        </div>
    )
}
