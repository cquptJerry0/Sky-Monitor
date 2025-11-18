import { useMemo } from 'react'
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout'
import type { Layouts } from 'react-grid-layout'

import { WidgetCard } from './widget/WidgetCard'
import { useUpdateWidgetsLayout } from '@/hooks/useDashboard'
import type { DashboardWidget } from '@/types/dashboard'
import { useToast } from '@/hooks/use-toast'

const ResponsiveGridLayout = WidthProvider(Responsive)

// 断点配置
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }

interface DashboardGridProps {
    dashboardId: string
    widgets: DashboardWidget[]
    onEditWidget?: (widget: DashboardWidget) => void
}

/**
 * Dashboard Grid 组件
 *
 * ## 核心功能
 * - 使用 react-grid-layout 实现拖拽和调整大小
 * - 支持响应式布局 (5 个断点: lg, md, sm, xs, xxs)
 * - 自动保存布局变化到后端
 * - 支持拖拽手柄 (只能通过标题栏拖拽)
 *
 * ## 布局系统
 * - **网格系统**: 12 列网格 (lg), 10 列 (md), 6 列 (sm), 4 列 (xs), 2 列 (xxs)
 * - **单位**: 每个 Widget 占据 w 列宽度, h 行高度
 * - **行高**: 80px (rowHeight)
 * - **最小尺寸**: minW: 2, minH: 2 (避免 Widget 太小)
 *
 * ## 响应式策略
 * - lg (>1200px): 使用原始布局
 * - md (996-1200px): 宽度限制为 10 列
 * - sm (768-996px): 宽度限制为 6 列
 * - xs (480-768px): 宽度固定为 4 列
 * - xxs (<480px): 宽度固定为 2 列
 *
 * ## 布局行为 (参考 ilert 最佳实践)
 * - **compactType="vertical"**: 自动垂直压缩,填充空白区域
 * - **preventCollision={false}**: 允许拖拽时重叠,提供更自由的布局体验
 * - 这种配置平衡了自动整理和手动控制,是业界推荐的方式
 *
 * ## 布局保存
 * - 只保存 lg 断点的布局 (其他断点自动计算)
 * - 拖拽或调整大小后自动触发保存
 * - 使用 mutation 更新后端数据
 *
 * ## 拖拽手柄
 * - 使用 `.widget-drag-handle` 类名标记拖拽区域
 * - 只能通过标题栏拖拽,避免误操作
 */
export function DashboardGrid({ dashboardId, widgets, onEditWidget }: DashboardGridProps) {
    const updateWidgetsLayout = useUpdateWidgetsLayout()
    const { toast } = useToast()

    /**
     * 转换为 react-grid-layout 的 Layouts 格式
     *
     * ## 多断点布局
     * - lg: 原始布局 (12 列)
     * - md: 宽度限制为 10 列
     * - sm: 宽度限制为 6 列
     * - xs: 宽度固定为 4 列
     * - xxs: 宽度固定为 2 列
     *
     * ## 为什么需要多断点?
     * - 不同屏幕尺寸下，Widget 宽度需要自适应
     * - 避免小屏幕下 Widget 太窄或重叠
     * - 提供更好的移动端体验
     */
    const layouts = useMemo<Layouts>(() => {
        const baseLayouts = widgets.map(widget => ({
            i: widget.id, // Widget ID (必须唯一)
            x: widget.layout.x, // X 坐标 (列)
            y: widget.layout.y, // Y 坐标 (行)
            w: widget.layout.w, // 宽度 (列数)
            h: widget.layout.h, // 高度 (行数)
            minW: 2, // 最小宽度
            minH: 2, // 最小高度
        }))

        return {
            lg: baseLayouts,
            md: baseLayouts.map(l => ({ ...l, w: Math.min(l.w, 10) })), // 宽度不超过 10 列
            sm: baseLayouts.map(l => ({ ...l, w: Math.min(l.w, 6) })), // 宽度不超过 6 列
            xs: baseLayouts.map(l => ({ ...l, w: 4 })), // 宽度固定为 4 列
            xxs: baseLayouts.map(l => ({ ...l, w: 2 })), // 宽度固定为 2 列
        }
    }, [widgets])

    /**
     * 布局变化时保存
     *
     * ## 触发时机
     * - 拖拽 Widget 结束
     * - 调整 Widget 大小结束
     *
     * ## 保存策略
     * - 只保存 lg 断点的布局 (其他断点自动计算)
     * - 批量更新所有 Widget 的布局 (一次请求)
     * - 使用 mutation 触发后端更新
     *
     * ## 性能优化
     * - react-grid-layout 自带防抖，不需要额外处理
     * - mutation 成功后自动失效 Dashboard 缓存，触发重新加载
     *
     * ## 用户反馈
     * - 保存成功时显示toast提示
     * - 保存失败时显示错误信息
     *
     * @param _currentLayout - 当前断点的布局 (未使用)
     * @param allLayouts - 所有断点的布局
     */
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

        updateWidgetsLayout.mutate(
            {
                dashboardId,
                layouts: layoutUpdates,
            },
            {
                onSuccess: () => {
                    toast({
                        title: '布局已保存',
                    })
                },
                onError: error => {
                    toast({
                        title: '保存失败',
                        description: error instanceof Error ? error.message : '保存失败',
                        variant: 'destructive',
                    })
                },
            }
        )
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
            resizeHandle={<div className="react-resizable-handle react-resizable-handle-se" />}
            compactType="vertical"
            preventCollision={false}
            isDraggable
            isResizable
        >
            {widgets.map(widget => (
                <div key={widget.id}>
                    <WidgetCard widget={widget} onEdit={onEditWidget} />
                </div>
            ))}
        </ResponsiveGridLayout>
    )
}
