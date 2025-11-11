import { Activity, AlertTriangle, AlertCircle, Users } from 'lucide-react'
import { StatCard } from './StatCard'

interface StatsSectionProps {
    totalEvents: number
    errorCount: number
    errorRate: string
    sessionCount: number
    loading?: boolean
    realtimeStats?: {
        eventTrend?: number
        errorTrend?: number
    } | null
}

export function StatsSection({ totalEvents, errorCount, errorRate, sessionCount, loading, realtimeStats }: StatsSectionProps) {
    const cards = [
        {
            title: '总事件数',
            value: totalEvents.toLocaleString(),
            icon: Activity,
            trend: realtimeStats?.eventTrend,
        },
        {
            title: '错误数',
            value: errorCount.toLocaleString(),
            icon: AlertTriangle,
            trend: realtimeStats?.errorTrend,
        },
        {
            title: '错误率',
            value: `${errorRate}%`,
            icon: AlertCircle,
        },
        {
            title: '活跃会话',
            value: sessionCount.toLocaleString(),
            icon: Users,
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map(card => (
                <StatCard key={card.title} {...card} loading={loading} />
            ))}
        </div>
    )
}
