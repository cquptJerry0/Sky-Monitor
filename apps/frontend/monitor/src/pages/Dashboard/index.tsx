import { AlertCircle } from 'lucide-react'
import { useAppContext } from '@/contexts/AppContext'
import { useDashboardData } from './hooks/useDashboardData'
import { useRealtimeData } from './hooks/useRealtimeData'
import { StatsSection } from './components/StatsSection'
import { ChartsSection } from './components/ChartsSection'
import { RealtimeSection } from './components/RealtimeSection'
import { PerformanceSection } from './components/PerformanceSection'

function EmptyState() {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
            <div className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">请先选择一个应用</p>
                <p className="text-sm text-muted-foreground mt-2">在顶部选择要监控的应用</p>
            </div>
        </div>
    )
}

export function Dashboard() {
    const { currentAppId } = useAppContext()
    const dashboardData = useDashboardData(currentAppId)
    const realtimeData = useRealtimeData(currentAppId)

    if (!currentAppId) {
        return <EmptyState />
    }

    return (
        <div className="space-y-6 p-6">
            {/* 统计卡片 */}
            <StatsSection {...dashboardData.stats} loading={dashboardData.isLoading} realtimeStats={realtimeData.realtimeStats} />

            {/* 图表区域 */}
            <ChartsSection {...dashboardData.charts} />

            {/* 实时错误 */}
            <RealtimeSection
                realtimeErrors={realtimeData.realtimeErrors}
                isConnected={realtimeData.isConnected}
                clearErrors={realtimeData.clearErrors}
            />

            {/* 性能指标 */}
            <PerformanceSection {...(dashboardData.performance || {})} />
        </div>
    )
}
