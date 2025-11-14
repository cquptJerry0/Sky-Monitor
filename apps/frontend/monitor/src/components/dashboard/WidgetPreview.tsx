import { AlertCircle, BarChart3, LineChart, Table2, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExecuteQueryResponse, WidgetType } from '@/types/dashboard'

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
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {getWidgetIcon(widgetType)}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">{renderChart(widgetType, data)}</div>
            </CardContent>
        </Card>
    )
}

/**
 * 获取 Widget 图标
 */
function getWidgetIcon(widgetType: WidgetType) {
    switch (widgetType) {
        case 'line':
            return <LineChart className="h-5 w-5" />
        case 'bar':
            return <BarChart3 className="h-5 w-5" />
        case 'area':
            return <TrendingUp className="h-5 w-5" />
        case 'table':
            return <Table2 className="h-5 w-5" />
        case 'big_number':
            return <TrendingUp className="h-5 w-5" />
        default:
            return null
    }
}

/**
 * 渲染图表
 */
function renderChart(widgetType: WidgetType, data: ExecuteQueryResponse) {
    const firstResult = data.results[0]
    const resultData = firstResult?.data || []

    switch (widgetType) {
        case 'line':
        case 'bar':
        case 'area':
            return (
                <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">图表预览</p>
                        <p className="mt-2 text-xs text-muted-foreground">数据行数: {resultData.length}</p>
                        {resultData.length > 0 && (
                            <pre className="mt-4 max-h-[200px] overflow-auto rounded bg-muted p-2 text-left text-xs">
                                {JSON.stringify(resultData.slice(0, 5), null, 2)}
                            </pre>
                        )}
                    </div>
                </div>
            )

        case 'table':
            return (
                <div className="h-full overflow-auto">
                    {resultData.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    {Object.keys(resultData[0]).map(key => (
                                        <th key={key} className="p-2 text-left font-medium">
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {resultData.slice(0, 10).map((row, index) => (
                                    <tr key={index} className="border-b">
                                        {Object.values(row).map((value, i) => (
                                            <td key={i} className="p-2">
                                                {String(value)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">暂无数据</div>
                    )}
                </div>
            )

        case 'big_number':
            return (
                <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl font-bold">{resultData.length > 0 ? Object.values(resultData[0])[0] : 0}</div>
                        <div className="mt-2 text-sm text-muted-foreground">{firstResult?.legend || '总计'}</div>
                    </div>
                </div>
            )

        default:
            return <div className="flex h-full items-center justify-center text-muted-foreground">不支持的图表类型</div>
    }
}
