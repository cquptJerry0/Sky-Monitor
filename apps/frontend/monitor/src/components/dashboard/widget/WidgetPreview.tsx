import { AlertCircle } from 'lucide-react'

import { ChartRenderer, getChartIcon } from '../charts/ChartRenderer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExecuteQueryResponse, WidgetType } from '@/types/dashboard'

interface WidgetPreviewProps {
    widgetType: WidgetType
    title: string
    data?: ExecuteQueryResponse
    isLoading?: boolean
    error?: Error | null
    showCard?: boolean
}

/**
 * Widget 预览组件
 */
export function WidgetPreview({ widgetType, title, data, isLoading, error, showCard = true }: WidgetPreviewProps) {
    // 渲染加载状态
    if (isLoading) {
        const content = (
            <div className="flex h-full items-center justify-center p-4">
                <div className="text-muted-foreground">加载中...</div>
            </div>
        )
        if (!showCard) return content
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>{content}</CardContent>
            </Card>
        )
    }

    // 渲染错误状态
    if (error) {
        const content = (
            <div className="flex h-full items-center justify-center p-4">
                <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span>查询失败: {error.message}</span>
                </div>
            </div>
        )
        if (!showCard) return content
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>{content}</CardContent>
            </Card>
        )
    }

    // 渲染空数据状态
    if (!data || !data.results || data.results.length === 0) {
        const content = (
            <div className="flex h-full items-center justify-center p-4">
                <div className="text-muted-foreground">暂无数据</div>
            </div>
        )
        if (!showCard) return content
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>{content}</CardContent>
            </Card>
        )
    }

    // 根据 widgetType 渲染不同的图表
    const Icon = getChartIcon(widgetType)
    const content = (
        <div className="h-full p-4">
            <ChartRenderer widgetType={widgetType} data={data} />
        </div>
    )

    if (!showCard) return content

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
