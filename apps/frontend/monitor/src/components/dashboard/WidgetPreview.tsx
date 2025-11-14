import { AlertCircle } from 'lucide-react'

import { ChartRenderer, getChartIcon } from './charts/ChartRenderer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExecuteQueryResponse, WidgetType } from '@/components/dashboard/types'

interface WidgetPreviewProps {
    widgetType: WidgetType
    title: string
    data?: ExecuteQueryResponse
    isLoading?: boolean
    error?: Error | null
}

/**
 * Widget 预览组件
 */
export function WidgetPreview({ widgetType, title, data, isLoading, error }: WidgetPreviewProps) {
    // 渲染加载状态
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex h-[300px] items-center justify-center">
                        <div className="text-muted-foreground">加载中...</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // 渲染错误状态
    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex h-[300px] items-center justify-center">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <span>查询失败: {error.message}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // 渲染空数据状态
    if (!data || !data.results || data.results.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex h-[300px] items-center justify-center">
                        <div className="text-muted-foreground">暂无数据</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // 根据 widgetType 渲染不同的图表
    const Icon = getChartIcon(widgetType)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ChartRenderer widgetType={widgetType} data={data} />
                </div>
            </CardContent>
        </Card>
    )
}
