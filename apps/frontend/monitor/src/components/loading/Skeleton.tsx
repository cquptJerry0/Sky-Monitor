/**
 * 骨架屏组件
 */

import { cn } from '@/lib/utils'

interface SkeletonProps {
    className?: string
}

export function Skeleton({ className }: SkeletonProps) {
    return <div className={cn('animate-pulse bg-muted rounded', className)} />
}

/**
 * 卡片骨架屏
 */
export function SkeletonCard() {
    return (
        <div className="p-6 bg-card border border-border rounded-lg space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
        </div>
    )
}

/**
 * 表格骨架屏
 */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    )
}
