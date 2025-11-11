import { useQuery, useQueries } from '@tanstack/react-query'
import * as srv from '@/services'

interface DashboardStats {
    totalEvents: number
    errorCount: number
    errorRate: string
    sessionCount: number
    performanceCount: number
}

interface ChartData {
    errorTrend: Array<{ time: string; count: number; occurrences: number }>
    eventDistribution: Array<{ name: string; value: number }>
}

export function useDashboardData(appId: string | null) {
    // 统计数据查询
    const statsQuery = useQuery({
        queryKey: ['dashboardStats', appId],
        queryFn: () => srv.fetchEventStats({ appId: appId || '' }),
        enabled: !!appId,
        refetchInterval: 30000, // 30秒刷新
    })

    // 错误趋势查询
    const errorTrendsQuery = useQuery({
        queryKey: ['errorTrends', appId],
        queryFn: () => srv.fetchErrorTrends({ appId: appId || '', window: 'hour' }),
        enabled: !!appId,
        refetchInterval: 60000, // 60秒刷新
    })

    // Web Vitals 查询
    const webVitalsQuery = useQuery({
        queryKey: ['webVitals', appId],
        queryFn: () => srv.fetchWebVitals({ appId: appId || undefined }),
        enabled: !!appId,
        refetchInterval: 30000,
    })

    // Session 统计查询
    const sessionQuery = useQuery({
        queryKey: ['sessionStats', appId],
        queryFn: () => srv.fetchSessionStats({ appId: appId || '', timeWindow: 'day' }),
        enabled: !!appId,
    })

    // 性能数据查询
    const performanceQuery = useQuery({
        queryKey: ['performance', appId],
        queryFn: () => srv.fetchPerformanceMetrics({ appId }),
        enabled: !!appId,
    })

    // 数据处理和转换
    const eventTypeCounts = statsQuery.data?.data?.eventTypeCounts || []
    const errorTrend = errorTrendsQuery.data?.data || []
    const webVitals = webVitalsQuery.data?.data?.data || []

    // 计算统计数据
    const totalEvents = eventTypeCounts.reduce((sum: number, item: any) => sum + item.count, 0)
    const errorCount = eventTypeCounts.find((item: any) => item.event_type === 'error')?.count || 0
    const performanceCount = eventTypeCounts.find((item: any) => item.event_type === 'webVital')?.count || 0
    const sessionCount = eventTypeCounts.find((item: any) => item.event_type === 'session')?.count || 0
    const errorRate = totalEvents > 0 ? ((errorCount / totalEvents) * 100).toFixed(2) : '0.00'

    // 图表数据转换
    const errorChartData = errorTrend.map((item: any) => ({
        time: item.time_bucket,
        count: item.count,
        occurrences: item.total_occurrences,
    }))

    const eventDistribution = eventTypeCounts.map((item: any) => ({
        name: item.event_type,
        value: item.count,
    }))

    return {
        stats: {
            totalEvents,
            errorCount,
            errorRate,
            sessionCount,
            performanceCount,
        } as DashboardStats,
        charts: {
            errorTrend: errorChartData,
            eventDistribution,
        } as ChartData,
        performance: performanceQuery.data?.data,
        isLoading: statsQuery.isLoading || errorTrendsQuery.isLoading,
        isError: statsQuery.isError || errorTrendsQuery.isError,
        refetch: () => {
            statsQuery.refetch()
            errorTrendsQuery.refetch()
            webVitalsQuery.refetch()
            sessionQuery.refetch()
            performanceQuery.refetch()
        },
    }
}
