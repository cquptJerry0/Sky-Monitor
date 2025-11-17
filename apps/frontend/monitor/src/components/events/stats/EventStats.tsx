import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, AlertCircle, BarChart3, Radio, Zap } from 'lucide-react'

interface EventStatsProps {
    total: number
    errors: number
    performance: number
    sessions: number
    webVitals: number
}

export function EventStats({ total, errors, performance, sessions, webVitals }: EventStatsProps) {
    const stats = [
        {
            title: '总事件数',
            value: total,
            icon: Activity,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: '错误事件',
            value: errors,
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
        {
            title: '性能事件',
            value: performance,
            icon: BarChart3,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Web Vitals',
            value: webVitals,
            icon: Zap,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
        },
        {
            title: '会话数',
            value: sessions,
            icon: Radio,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
    ]

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {stats.map(stat => {
                const Icon = stat.icon
                return (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div className={`rounded-full p-2 ${stat.bgColor}`}>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
