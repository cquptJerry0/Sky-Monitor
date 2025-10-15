import { useSearchParams } from 'react-router-dom'

import { MetricCard } from '@/components/MetricCard'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { appLogoMap } from '@/pages/Projects/meta'
import { ApplicationType } from '@/types/api'

const fpMetrics = Array.from({ length: 140 }, (_, i) => ({
    ms: i,
    count: Math.floor(Math.random() * (100 - 20) + 20),
}))

const fcpMetrics = Array.from({ length: 69 }, (_, i) => ({
    ms: i,
    count: Math.floor(Math.random() * (100 - 20) + 20),
}))

const lcpMetrics = Array.from({ length: 32 }, (_, i) => ({
    ms: i,
    count: Math.floor(Math.random() * (100 - 20) + 20),
}))

const fidMetrics = Array.from({ length: 0 }, (_, i) => ({
    ms: i,
    count: Math.floor(Math.random() * (100 - 20) + 20),
}))

const clsMetrics = Array.from({ length: 1 }, (_, i) => ({
    ms: i,
    count: Math.floor(Math.random() * (100 - 20) + 20),
}))

export function PerformanceSummary() {
    const searchParam = useSearchParams()[0]
    const appType = (searchParam.get('appType') ?? 'vanilla') as ApplicationType
    const transaction = searchParam.get('transaction')
    // const project = searchParam.get('project')

    return (
        <div className="flex-1 flex-col">
            <header className="flex flex-col gap-2 mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <a href="/performance">性能</a>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbPage>性能概览</BreadcrumbPage>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="flex flex-row items-center h-[36px] text-xl font-semibold">
                    <img src={appLogoMap[appType]} alt={appType} className="h-8 w-8 mr-2 rounded" />
                    {transaction}
                </h1>
            </header>
            <div className="flex flex-col gap-4">
                <Card className="flex flex-col flex-grow">
                    <CardContent className="p-0">
                        <MetricCard type="fp" value={78.1} metrics={fpMetrics} />
                        <Separator />
                        <MetricCard type="fcp" value={78.1} metrics={fcpMetrics} />
                        <Separator />
                        <MetricCard type="lcp" value={78.1} metrics={lcpMetrics} />
                        <Separator />
                        <MetricCard type="fid" metrics={fidMetrics} />
                        <Separator />
                        <MetricCard type="cls" value={0} metrics={clsMetrics} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
