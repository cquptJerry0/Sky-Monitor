/**
 * 页面加载组件
 */

import { Loader2 } from 'lucide-react'

export function PageLoading() {
    return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
                <p className="text-sm text-[var(--text-secondary)]">加载中...</p>
            </div>
        </div>
    )
}
