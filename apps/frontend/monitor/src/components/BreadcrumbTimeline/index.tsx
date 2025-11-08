import { formatDate } from 'date-fns'
import { Code, Globe, MousePointer, Terminal } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Breadcrumb {
    message: string
    level?: 'debug' | 'info' | 'warning' | 'error'
    category?: string
    timestamp?: number
    data?: Record<string, unknown>
}

interface BreadcrumbTimelineProps {
    breadcrumbs: Breadcrumb[]
    errorTimestamp?: string
}

export function BreadcrumbTimeline({ breadcrumbs, errorTimestamp }: BreadcrumbTimelineProps) {
    const getCategoryIcon = (category?: string) => {
        switch (category) {
            case 'console':
                return <Terminal className="h-4 w-4" />
            case 'ui':
            case 'click':
                return <MousePointer className="h-4 w-4" />
            case 'navigation':
                return <Globe className="h-4 w-4" />
            case 'http':
                return <Code className="h-4 w-4" />
            default:
                return <Code className="h-4 w-4" />
        }
    }

    const getLevelColor = (level?: string) => {
        switch (level) {
            case 'error':
                return 'text-red-500'
            case 'warning':
                return 'text-yellow-500'
            case 'info':
                return 'text-blue-500'
            case 'debug':
                return 'text-gray-500'
            default:
                return 'text-gray-400'
        }
    }

    if (!breadcrumbs || breadcrumbs.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>用户行为轨迹</CardTitle>
                    <CardDescription>错误发生前的用户操作记录</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">暂无面包屑数据</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>用户行为轨迹</CardTitle>
                <CardDescription>错误发生前的用户操作记录（共 {breadcrumbs.length} 条）</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative space-y-4">
                    {breadcrumbs.map((breadcrumb, index) => {
                        const isErrorPoint =
                            errorTimestamp &&
                            breadcrumb.timestamp &&
                            Math.abs(new Date(errorTimestamp).getTime() - breadcrumb.timestamp) < 1000

                        return (
                            <div key={index} className="relative flex gap-3">
                                {index < breadcrumbs.length - 1 && <div className="absolute left-[11px] top-6 h-full w-[2px] bg-border" />}

                                <div
                                    className={`relative z-10 mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                                        isErrorPoint ? 'border-red-500 bg-red-100' : 'border-border bg-background'
                                    } ${getLevelColor(breadcrumb.level)}`}
                                >
                                    {getCategoryIcon(breadcrumb.category)}
                                </div>

                                <div className="flex-1 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium ${isErrorPoint ? 'text-red-500 font-bold' : ''}`}>
                                                {breadcrumb.message}
                                            </span>
                                            {isErrorPoint && (
                                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">错误发生点</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {breadcrumb.timestamp ? formatDate(new Date(breadcrumb.timestamp), 'HH:mm:ss.SSS') : ''}
                                        </span>
                                    </div>

                                    {breadcrumb.category && (
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">类型: {breadcrumb.category}</span>
                                            {breadcrumb.level && (
                                                <span className={`text-xs ${getLevelColor(breadcrumb.level)}`}>
                                                    级别: {breadcrumb.level}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {breadcrumb.data && Object.keys(breadcrumb.data).length > 0 && (
                                        <details className="mt-2">
                                            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                                                查看详细数据
                                            </summary>
                                            <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-2 text-xs">
                                                {JSON.stringify(breadcrumb.data, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
