import { AreaChartIcon, BarChartIcon, HashIcon, LineChartIcon, TableIcon } from 'lucide-react'

import { AreaChartWidget } from './AreaChartWidget'
import { BarChartWidget } from './BarChartWidget'
import { BigNumberWidget } from './BigNumberWidget'
import { LineChartWidget } from './LineChartWidget'
import { TableChartWidget } from './TableChartWidget'
import type { ExecuteQueryResponse, WidgetType } from '@/components/dashboard/dashboard.types'

interface ChartRendererProps {
    widgetType: WidgetType
    data: ExecuteQueryResponse
}

/**
 * 图表渲染器
 * 根据 widgetType 渲染不同的图表类型
 */
export function ChartRenderer({ widgetType, data }: ChartRendererProps) {
    // 根据 widgetType 渲染不同的图表
    switch (widgetType) {
        case 'line':
            return <LineChartWidget data={data} />
        case 'bar':
            return <BarChartWidget data={data} />
        case 'area':
            return <AreaChartWidget data={data} />
        case 'table':
            return <TableChartWidget data={data} />
        case 'big_number':
            return <BigNumberWidget data={data} />
        default:
            return <div className="text-muted-foreground">不支持的图表类型: {widgetType}</div>
    }
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
        case 'table':
            return TableIcon
        case 'big_number':
            return HashIcon
        default:
            return LineChartIcon
    }
}
