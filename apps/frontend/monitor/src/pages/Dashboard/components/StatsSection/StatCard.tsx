import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
    title: string
    value: string
    icon: LucideIcon
    trend?: number
    loading?: boolean
}

export function StatCard({ title, value, icon: Icon, trend, loading }: StatCardProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-32 mt-2" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {trend !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">
                        <span className={trend > 0 ? 'text-red-500' : 'text-green-500'}>
                            {trend > 0 ? '+' : ''}
                            {trend}%
                        </span>{' '}
                        较昨日
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
