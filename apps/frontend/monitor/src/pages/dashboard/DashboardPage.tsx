import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { DashboardGrid, TimeRangePicker, WidgetBuilder } from '@/components/dashboard'
import type { DashboardWidget } from '@/types/dashboard'
import { AppSelector } from '@/components/layout/AppSelector'
import { Button } from '@/components/ui/button'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useCreateDashboard, useDashboard, useDashboards } from '@/hooks/useDashboard'
import { useDashboardStore } from '@/stores/dashboard.store'

/**
 * Dashboard 页面
 *
 * ## 核心功能
 * 1. **Dashboard 管理**: 创建和管理多个自定义仪表盘
 * 2. **Widget 系统**: 支持 5 种图表类型 (折线图、柱状图、面积图、表格、大数字)
 * 3. **拖拽布局**: 使用 react-grid-layout 实现拖拽和调整大小
 * 4. **自定义查询**: 支持 ClickHouse SQL 查询和可视化配置
 * 5. **时间范围选择**: 支持快捷时间范围和自定义时间范围
 *
 * ## 数据流
 * 1. **Dashboard 列表**: useDashboards() -> 获取所有 Dashboard
 * 2. **Dashboard 详情**: useDashboard(id) -> 获取当前 Dashboard 和 Widgets
 * 3. **Widget 查询**: useExecuteQuery() -> 执行 ClickHouse 查询获取数据
 * 4. **图表渲染**: ChartRenderer -> 根据 Widget 类型渲染对应图表
 *
 * ## 状态管理
 * - **全局状态** (useDashboardStore):
 *   - selectedAppId: 当前选中的应用 ID
 *   - currentDashboardId: 当前选中的 Dashboard ID
 *   - timeRange: 时间范围 (start, end)
 *   - timeRangePreset: 时间范围预设 (1h, 24h, 7d, 30d, custom)
 * - **本地状态**:
 *   - widgetBuilderOpen: Widget 构建器弹窗状态
 *
 * ## 关键逻辑
 * - **自动同步应用**: 当 currentApp 变化时，自动更新 selectedAppId
 * - **自动选择 Dashboard**: 当 Dashboard 列表加载完成且没有选中 Dashboard 时，自动选择第一个
 * - **空状态处理**: 没有 Dashboard 时显示创建提示，没有 Widget 时显示添加提示
 */
export default function DashboardPage() {
    const { currentApp } = useCurrentApp()
    const { selectedAppId, setSelectedAppId, currentDashboardId, setCurrentDashboardId } = useDashboardStore()

    // Widget Builder 弹窗状态
    const [widgetBuilderOpen, setWidgetBuilderOpen] = useState(false)
    const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null)

    // 获取 Dashboard 列表
    const { data: dashboards, isLoading: isDashboardsLoading } = useDashboards()

    // 获取当前 Dashboard 详情 (包含 Widgets)
    const { data: currentDashboard, isLoading: isDashboardLoading } = useDashboard(currentDashboardId)

    // 创建 Dashboard mutation
    const createDashboard = useCreateDashboard()

    /**
     * 同步当前应用到 Dashboard Store
     *
     * ## 为什么需要同步?
     * - currentApp 来自全局应用选择器 (AppSelector)
     * - Dashboard Store 需要知道当前应用 ID 来过滤 Widget 查询
     * - 确保 Dashboard 和应用选择器状态一致
     */
    useEffect(() => {
        if (currentApp?.appId && currentApp.appId !== selectedAppId) {
            setSelectedAppId(currentApp.appId)
        }
    }, [currentApp, selectedAppId, setSelectedAppId])

    /**
     * 自动选择第一个 Dashboard
     *
     * ## 触发条件
     * - Dashboard 列表加载完成
     * - 当前没有选中任何 Dashboard
     * - Dashboard 列表不为空
     *
     * ## 为什么需要自动选择?
     * - 避免用户进入页面时看到空白
     * - 提供更好的用户体验
     */
    useEffect(() => {
        if (dashboards && dashboards.length > 0 && !currentDashboardId) {
            const firstDashboard = dashboards[0]
            if (firstDashboard) {
                setCurrentDashboardId(firstDashboard.id)
            }
        }
    }, [dashboards, currentDashboardId, setCurrentDashboardId])

    /**
     * 创建默认 Dashboard
     *
     * ## 使用场景
     * - 用户首次进入 Dashboard 页面
     * - 没有任何 Dashboard 时显示创建按钮
     */
    const handleCreateDashboard = async () => {
        await createDashboard.mutateAsync({
            name: '我的仪表盘',
            description: '自定义监控仪表盘',
        })
    }

    /**
     * 编辑 Widget
     */
    const handleEditWidget = (widget: DashboardWidget) => {
        setEditingWidget(widget)
        setWidgetBuilderOpen(true)
    }

    /**
     * 关闭 Widget Builder
     */
    const handleCloseWidgetBuilder = () => {
        setWidgetBuilderOpen(false)
        setEditingWidget(null)
    }

    if (isDashboardsLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">加载中...</div>
            </div>
        )
    }

    // 如果没有 Dashboard,显示创建提示
    if (!dashboards || dashboards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">欢迎使用仪表盘</h2>
                    <p className="text-muted-foreground">创建你的第一个仪表盘,开始自定义监控视图</p>
                </div>
                <Button onClick={handleCreateDashboard} disabled={createDashboard.isPending}>
                    <Plus className="mr-2 h-4 w-4" />
                    创建仪表盘
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{currentDashboard?.name || '仪表盘'}</h1>
                    <p className="text-muted-foreground mt-1">{currentDashboard?.description || '自定义监控视图'}</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* 应用选择器 */}
                    <AppSelector />

                    {/* 时间范围选择器 */}
                    <TimeRangePicker />

                    {/* 添加 Widget 按钮 */}
                    <Button onClick={() => setWidgetBuilderOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        添加 Widget
                    </Button>
                </div>
            </div>

            {/* Widget Builder 弹窗 */}
            {currentDashboardId && (
                <WidgetBuilder
                    dashboardId={currentDashboardId}
                    open={widgetBuilderOpen}
                    onOpenChange={handleCloseWidgetBuilder}
                    editingWidget={editingWidget}
                />
            )}

            {/* Dashboard Grid */}
            {isDashboardLoading ? (
                <div className="flex items-center justify-center h-96">
                    <div className="text-muted-foreground">加载中...</div>
                </div>
            ) : currentDashboard?.widgets && currentDashboard.widgets.length > 0 ? (
                <DashboardGrid dashboardId={currentDashboard.id} widgets={currentDashboard.widgets} onEditWidget={handleEditWidget} />
            ) : (
                <div className="flex flex-col items-center justify-center h-96 space-y-4 border-2 border-dashed rounded-lg">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">暂无 Widget</h3>
                        <p className="text-muted-foreground">点击"添加 Widget"按钮开始创建</p>
                    </div>
                    <Button onClick={() => setWidgetBuilderOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        添加 Widget
                    </Button>
                </div>
            )}
        </div>
    )
}
