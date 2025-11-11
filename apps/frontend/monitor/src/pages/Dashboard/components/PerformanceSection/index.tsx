import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PerformanceSectionProps {
    fcp?: number
    lcp?: number
    fid?: number
    cls?: number
    ttfb?: number
}

const getScoreColor = (metric: string, value: number): string => {
    const thresholds: Record<string, { good: number; poor: number }> = {
        fcp: { good: 1800, poor: 3000 },
        lcp: { good: 2500, poor: 4000 },
        fid: { good: 100, poor: 300 },
        cls: { good: 0.1, poor: 0.25 },
        ttfb: { good: 800, poor: 1800 },
    }

    const threshold = thresholds[metric]
    if (!threshold) return 'text-muted-foreground'

    if (value <= threshold.good) return 'text-green-500'
    if (value >= threshold.poor) return 'text-red-500'
    return 'text-yellow-500'
}

const getScoreLabel = (metric: string, value: number): string => {
    const thresholds: Record<string, { good: number; poor: number }> = {
        fcp: { good: 1800, poor: 3000 },
        lcp: { good: 2500, poor: 4000 },
        fid: { good: 100, poor: 300 },
        cls: { good: 0.1, poor: 0.25 },
        ttfb: { good: 800, poor: 1800 },
    }

    const threshold = thresholds[metric]
    if (!threshold) return '未知'

    if (value <= threshold.good) return '良好'
    if (value >= threshold.poor) return '较差'
    return '需改进'
}

const formatValue = (metric: string, value: number): string => {
    if (metric === 'cls') {
        return value.toFixed(3)
    }
    return `${Math.round(value)} ms`
}

export function PerformanceSection({ fcp, lcp, fid, cls, ttfb }: PerformanceSectionProps) {
    const metrics = [
        { key: 'fcp', name: 'FCP', description: 'First Contentful Paint', value: fcp },
        { key: 'lcp', name: 'LCP', description: 'Largest Contentful Paint', value: lcp },
        { key: 'fid', name: 'FID', description: 'First Input Delay', value: fid },
        { key: 'cls', name: 'CLS', description: 'Cumulative Layout Shift', value: cls },
        { key: 'ttfb', name: 'TTFB', description: 'Time to First Byte', value: ttfb },
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>性能指标</CardTitle>
                <CardDescription>Core Web Vitals 和关键性能指标</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-5">
                    {metrics.map(metric => (
                        <div key={metric.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">{metric.name}</p>
                                {metric.value !== undefined && (
                                    <Badge variant="outline" className={cn('text-xs', getScoreColor(metric.key, metric.value))}>
                                        {getScoreLabel(metric.key, metric.value)}
                                    </Badge>
                                )}
                            </div>
                            <p
                                className={cn(
                                    'text-2xl font-bold',
                                    metric.value !== undefined ? getScoreColor(metric.key, metric.value) : 'text-muted-foreground'
                                )}
                            >
                                {metric.value !== undefined ? formatValue(metric.key, metric.value) : '-'}
                            </p>
                            <p className="text-xs text-muted-foreground">{metric.description}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
