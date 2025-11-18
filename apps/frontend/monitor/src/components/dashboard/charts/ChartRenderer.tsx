import { AreaChartIcon, BarChartIcon, HashIcon, LineChartIcon, TableIcon, RadarIcon, PieChartIcon } from 'lucide-react'

import { AreaChartWidget } from './AreaChartWidget'
import { BarChartWidget } from './BarChartWidget'
import { BigNumberWidget } from './BigNumberWidget'
import { LineChartWidget } from './LineChartWidget'
import { PieChartWidget } from './PieChartWidget'
import { RadarChartWidget } from './RadarChartWidget'
import { TableChartWidget } from './TableChartWidget'
import { WebVitalsChartWidget } from './WebVitalsChartWidget'
import type { ExecuteQueryResponse, WidgetType } from '@/types/dashboard'

interface ChartRendererProps {
    widgetType: WidgetType
    data: ExecuteQueryResponse
}

/**
 * 图表渲染器
 * 根据 widgetType 渲染不同的图表类型
 */
export function ChartRenderer({ widgetType, data }: ChartRendererProps) {
    // 检查是否是 Web Vitals 图表
    const isWebVitals = isWebVitalsChart(data)

    // 根据 widgetType 渲染不同的图表
    switch (widgetType) {
        case 'line':
            // 如果是 Web Vitals 数据,使用专用图表
            if (isWebVitals) {
                return <WebVitalsChartWidget data={data} />
            }
            return <LineChartWidget data={data} />
        case 'bar':
            return <BarChartWidget data={data} />
        case 'area':
            return <AreaChartWidget data={data} />
        case 'pie':
            return <PieChartWidget data={data} />
        case 'table':
            return <TableChartWidget data={data} />
        case 'big_number':
            return <BigNumberWidget data={data} />
        case 'radar':
            return <RadarChartWidget data={data} />
        default:
            return <div className="text-muted-foreground">不支持的图表类型: {widgetType}</div>
    }
}

/**
 * 判断是否是 Web Vitals 图表
 * 通过检查 title 或 legend 中是否包含 Web Vitals 相关关键词
 */
function isWebVitalsChart(data: ExecuteQueryResponse): boolean {
    // 检查标题
    if (data.title?.toLowerCase().includes('web vitals')) {
        return true
    }

    // 检查是否有多个 Web Vitals 指标
    const webVitalsKeywords = ['lcp', 'fcp', 'ttfb', 'inp', 'fid', 'cls']
    const matchCount = data.results.filter(result => {
        const legend = result.legend?.toLowerCase() || ''
        return webVitalsKeywords.some(keyword => legend.includes(keyword))
    }).length

    // 如果有 2 个或以上的 Web Vitals 指标,认为是 Web Vitals 图表
    return matchCount >= 2
}

/**
 * 获取图表类型图标
 */
export function getChartIcon(widgetType: WidgetType) {
    switch (widgetType) {
        case 'line':
            return LineChartIcon
        case 'bar':
            return BarChartIcon
        case 'area':
            return AreaChartIcon
        case 'pie':
            return PieChartIcon
        case 'table':
            return TableIcon
        case 'big_number':
            return HashIcon
        case 'radar':
            return RadarIcon
        default:
            return LineChartIcon
    }
}
