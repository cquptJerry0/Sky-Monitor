import { ErrorTrendChart } from './ErrorTrendChart.tsx'
import { EventDistribution } from './EventDistribution.tsx'

interface ChartsSectionProps {
    errorTrend: Array<{ time: string; count: number; occurrences: number }>
    eventDistribution: Array<{ name: string; value: number }>
}

export function ChartsSection({ errorTrend, eventDistribution }: ChartsSectionProps) {
    return (
        <div className="grid gap-4 md:grid-cols-7">
            <ErrorTrendChart data={errorTrend} />
            <EventDistribution data={eventDistribution} />
        </div>
    )
}
