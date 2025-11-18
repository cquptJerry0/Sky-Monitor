import { Plus, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { DashboardGrid, TimeRangePicker, WidgetBuilder } from '@/components/dashboard'
import type { DashboardWidget } from '@/types/dashboard'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCurrentAppId } from '@/hooks/useCurrentApp'
import { useDashboard, useDashboards, useResetWidgets } from '@/hooks/useDashboard'
import { useDashboardStore } from '@/stores/dashboard.store'
import { useToast } from '@/hooks/use-toast'
import { ROUTES } from '@/utils/constants'
import { useApplications } from '@/hooks/useApplicationQuery'

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
 *   - currentDashboardId: 当前选中的 Dashboard ID
 *   - timeRange: 时间范围 (start, end)
 *   - timeRangePreset: 时间范围预设 (1h, 24h, 7d, 30d, custom)
 * - **全局状态** (useAppStore):
 *   - currentAppId: 当前选中的应用 ID (统一使用全局状态)
 * - **本地状态**:
 *   - widgetBuilderOpen: Widget 构建器弹窗状态
 *
 * ## 关键逻辑
 * - **自动选择 Dashboard**: 当 Dashboard 列表加载完成且没有选中 Dashboard 时，自动选择第一个
 * - **空状态处理**: 没有 Dashboard 时显示创建提示，没有 Widget 时显示添加提示
 */
export default function DashboardPage() {
    const navigate = useNavigate()
    const currentAppId = useCurrentAppId()
    const { currentDashboardId, setCurrentDashboardId } = useDashboardStore()
    const { toast } = useToast()

    // Widget Builder 弹窗状态
    const [widgetBuilderOpen, setWidgetBuilderOpen] = useState(false)
    const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null)

    // 恢复默认弹窗状态
    const [showResetDialog, setShowResetDialog] = useState(false)

    // 跟踪appId切换状态
    const [isAppChanging, setIsAppChanging] = useState(false)
    const [previousAppId, setPreviousAppId] = useState<string | null>(currentAppId)

    // 获取应用列表,用于验证 currentAppId 是否有效
    const { data: applications = [], isLoading: isApplicationsLoading } = useApplications()

    // 获取 Dashboard 列表 (按当前appId过滤)
    const { data: dashboards, isLoading: isDashboardsLoading, isFetching: isDashboardsFetching } = useDashboards(currentAppId || undefined)

    // 获取当前 Dashboard 详情 (包含 Widgets)
    const { data: currentDashboard, isLoading: isDashboardLoading } = useDashboard(currentDashboardId)

    // 恢复默认 Widget mutation
    const resetWidgets = useResetWidgets()

    /**
     * 当appId变化时,清空当前选中的dashboard并标记为切换中
     * 让自动选择逻辑重新选择第一个dashboard
     */
    useEffect(() => {
        if (currentAppId !== previousAppId) {
            setIsAppChanging(true)
            setCurrentDashboardId(null)
            setPreviousAppId(currentAppId)
        }
    }, [currentAppId, previousAppId, setCurrentDashboardId])

    /**
     * 当dashboard列表加载完成后,取消切换状态
     */
    useEffect(() => {
        if (isAppChanging && !isDashboardsLoading && !isDashboardsFetching) {
            setIsAppChanging(false)
        }
    }, [isAppChanging, isDashboardsLoading, isDashboardsFetching])

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

    /**
     * 恢复默认 Widget
     */
    const handleResetWidgets = async () => {
        if (!currentDashboardId) return

        try {
            await resetWidgets.mutateAsync(currentDashboardId)
            setShowResetDialog(false)
            toast({
                title: '恢复成功',
                description: '已恢复默认Widget',
            })
        } catch (error) {
            toast({
                title: '恢复失败',
                description: error instanceof Error ? error.message : '恢复失败',
                variant: 'destructive',
            })
        }
    }

    // 显示loading状态 (初次加载或切换app)
    if (isDashboardsLoading || isAppChanging || isApplicationsLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">{isAppChanging ? '切换应用中...' : '加载中...'}</div>
            </div>
        )
    }

    // 检查当前 appId 是否有效
    const currentAppExists = currentAppId && applications.some(app => app.appId === currentAppId)

    // 如果没有应用或当前应用无效,引导用户去创建应用
    if (applications.length === 0 || !currentAppExists) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">暂无监控面板</h2>
                    <p className="text-muted-foreground">请先创建一个应用,系统会自动为您生成默认监控面板</p>
                </div>
                <Button onClick={() => navigate(ROUTES.PROJECTS)}>
                    <Plus className="mr-2 h-4 w-4" />
                    创建应用
                </Button>
            </div>
        )
    }

    // 如果有应用但没有 Dashboard,引导用户联系管理员
    if (!dashboards || dashboards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">暂无监控面板</h2>
                    <p className="text-muted-foreground">当前应用暂无监控面板,请联系管理员</p>
                </div>
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
                    {/* 时间范围选择器 */}
                    <TimeRangePicker />

                    {/* 恢复默认 Widget 按钮 */}
                    <Button
                        variant="outline"
                        onClick={() => setShowResetDialog(true)}
                        disabled={resetWidgets.isPending || !currentDashboard?.appId}
                        title={!currentDashboard?.appId ? '只有关联应用的Dashboard才能恢复默认Widget' : '恢复默认Widget'}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        恢复默认
                    </Button>

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

            {/* 恢复默认 Widget 确认弹窗 */}
            <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认恢复默认Widget?</AlertDialogTitle>
                        <AlertDialogDescription>这将删除当前所有Widget并重新创建默认的4个Widget,此操作无法撤销。</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleResetWidgets}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            确认恢复
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
