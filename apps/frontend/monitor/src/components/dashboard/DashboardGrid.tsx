import { useMemo } from 'react'
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout'
import type { Layouts } from 'react-grid-layout'

import { WidgetPreview } from './WidgetPreview'
import { useUpdateWidgetsLayout } from '@/hooks/useDashboard'
import type { DashboardWidget } from '@/types/dashboard'

const ResponsiveGridLayout = WidthProvider(Responsive)

// 断点配置
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }

interface DashboardGridProps {
    dashboardId: string
    widgets: DashboardWidget[]
}

/**
 * Dashboard Grid 组件
 * 支持拖拽和调整大小
 */
export function DashboardGrid({ dashboardId, widgets }: DashboardGridProps) {
    const updateWidgetsLayout = useUpdateWidgetsLayout()

    // 转换为 react-grid-layout 的 Layouts 格式 (支持多断点)
    const layouts = useMemo<Layouts>(() => {
        const baseLayouts = widgets.map(widget => ({
            i: widget.id,
            x: widget.layout.x,
            y: widget.layout.y,
            w: widget.layout.w,
            h: widget.layout.h,
            minW: 2,
            minH: 2,
        }))

        return {
            lg: baseLayouts,
            md: baseLayouts.map(l => ({ ...l, w: Math.min(l.w, 10) })),
            sm: baseLayouts.map(l => ({ ...l, w: Math.min(l.w, 6) })),
            xs: baseLayouts.map(l => ({ ...l, w: 4 })),
            xxs: baseLayouts.map(l => ({ ...l, w: 2 })),
        }
    }, [widgets])

    // 布局变化时保存 (只保存 lg 断点的布局)
    const handleLayoutChange = (_currentLayout: Layout[], allLayouts: Layouts) => {
        const lgLayouts = allLayouts.lg || []
        const layoutUpdates = lgLayouts.map(layout => ({
            id: layout.i,
            layout: {
                x: layout.x,
                y: layout.y,
                w: layout.w,
                h: layout.h,
            },
        }))

        updateWidgetsLayout.mutate({
            dashboardId,
            layouts: layoutUpdates,
        })
    }

    return (
        <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={80}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".widget-drag-handle"
            isDraggable
            isResizable
        >
            {widgets.map(widget => (
                <div key={widget.id} className="rounded-lg border bg-card shadow-sm">
                    <div className="widget-drag-handle cursor-move rounded-t-lg border-b bg-muted/50 px-4 py-2">
                        <h3 className="text-sm font-semibold">{widget.title}</h3>
                    </div>
                    <div className="widget-content p-4">
                        <WidgetPreview widgetType={widget.widgetType} title={widget.title} data={undefined} isLoading={false} />
                    </div>
                </div>
            ))}
        </ResponsiveGridLayout>
    )
}
