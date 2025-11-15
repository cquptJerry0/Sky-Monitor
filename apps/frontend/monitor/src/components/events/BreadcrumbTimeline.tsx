import { Badge } from '@/components/ui/badge'
import { formatEventTime } from '@/utils/eventUtils'
import { Clock, MousePointer, Navigation, Globe, AlertCircle } from 'lucide-react'

interface Breadcrumb {
    timestamp: number
    category: string
    message: string
    level?: string
    data?: Record<string, unknown>
}

interface BreadcrumbTimelineProps {
    breadcrumbs: Breadcrumb[]
}

export function BreadcrumbTimeline({ breadcrumbs }: BreadcrumbTimelineProps) {
    const getCategoryIcon = (category: string) => {
        if (category === 'ui.click' || category === 'ui') return <MousePointer className="h-4 w-4" />
        if (category === 'navigation') return <Navigation className="h-4 w-4" />
        if (category === 'http') return <Globe className="h-4 w-4" />
        if (category === 'console') return <AlertCircle className="h-4 w-4" />
        return <Clock className="h-4 w-4" />
    }

    const getLevelColor = (level?: string) => {
        switch (level) {
            case 'error':
                return 'text-red-500 bg-red-50 border-red-200'
            case 'warning':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200'
            case 'info':
                return 'text-blue-500 bg-blue-50 border-blue-200'
            default:
                return 'text-gray-500 bg-gray-50 border-gray-200'
        }
    }

    return (
        <div className="space-y-3">
            {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex gap-3">
                    {/* 时间线 */}
                    <div className="flex flex-col items-center">
                        <div className={`rounded-full p-2 border ${getLevelColor(crumb.level)}`}>{getCategoryIcon(crumb.category)}</div>
                        {index < breadcrumbs.length - 1 && <div className="w-px h-full bg-border mt-2" />}
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                                {crumb.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {formatEventTime(new Date(crumb.timestamp).toISOString())}
                            </span>
                        </div>
                        <p className="text-sm">{crumb.message}</p>
                        {crumb.data && Object.keys(crumb.data).length > 0 && (
                            <details className="mt-2">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">查看详情</summary>
                                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                    {JSON.stringify(crumb.data, null, 2)}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
