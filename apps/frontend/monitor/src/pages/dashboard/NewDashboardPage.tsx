import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { TimeRangePicker } from '@/components/dashboard/TimeRangePicker'
import { WidgetBuilder } from '@/components/dashboard/WidgetBuilder'
import { AppSelector } from '@/components/layout/AppSelector'
import { Button } from '@/components/ui/button'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useCreateDashboard, useDashboard, useDashboards } from '@/hooks/useDashboard'
import { useDashboardStore } from '@/stores/dashboard.store'

/**
 * 新版 Dashboard 页面
 * 支持自定义 Widget 和拖拽布局
 */
export default function NewDashboardPage() {
    const { currentApp } = useCurrentApp()
    const { selectedAppId, setSelectedAppId, currentDashboardId, setCurrentDashboardId } = useDashboardStore()

    // Widget Builder 弹窗状态
    const [widgetBuilderOpen, setWidgetBuilderOpen] = useState(false)

    // 获取 Dashboard 列表
    const { data: dashboards, isLoading: isDashboardsLoading } = useDashboards()

    // 获取当前 Dashboard 详情
    const { data: currentDashboard, isLoading: isDashboardLoading } = useDashboard(currentDashboardId)

    // 创建 Dashboard
    const createDashboard = useCreateDashboard()

    // 同步当前应用
    useEffect(() => {
        if (currentApp?.appId && currentApp.appId !== selectedAppId) {
            setSelectedAppId(currentApp.appId)
        }
    }, [currentApp, selectedAppId, setSelectedAppId])

    // 自动选择第一个 Dashboard
    useEffect(() => {
        if (dashboards && dashboards.length > 0 && !currentDashboardId) {
            setCurrentDashboardId(dashboards[0].id)
        }
    }, [dashboards, currentDashboardId, setCurrentDashboardId])

    // 创建默认 Dashboard
    const handleCreateDashboard = async () => {
        await createDashboard.mutateAsync({
            name: '我的仪表盘',
            description: '自定义监控仪表盘',
        })
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
                <WidgetBuilder dashboardId={currentDashboardId} open={widgetBuilderOpen} onOpenChange={setWidgetBuilderOpen} />
            )}

            {/* Dashboard Grid */}
            {isDashboardLoading ? (
                <div className="flex items-center justify-center h-96">
                    <div className="text-muted-foreground">加载中...</div>
                </div>
            ) : currentDashboard?.widgets && currentDashboard.widgets.length > 0 ? (
                <div className="grid grid-cols-12 gap-4">
                    {currentDashboard.widgets.map(widget => (
                        <div
                            key={widget.id}
                            className="col-span-12 md:col-span-6 lg:col-span-4"
                            style={{
                                gridColumn: `span ${widget.layout.w}`,
                                gridRow: `span ${widget.layout.h}`,
                            }}
                        >
                            <div className="border rounded-lg p-4 h-full">
                                <h3 className="font-semibold mb-2">{widget.title}</h3>
                                <div className="text-sm text-muted-foreground">Widget 类型: {widget.widgetType}</div>
                            </div>
                        </div>
                    ))}
                </div>
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
