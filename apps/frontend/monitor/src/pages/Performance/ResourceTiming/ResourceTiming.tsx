import { useQuery } from '@tanstack/react-query'
import { Timer } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fetchResourceTiming } from '@/services'

export function ResourceTiming() {
    const { data: resourceTimingData, isLoading } = useQuery({
        queryKey: ['resourceTiming'],
        queryFn: () => fetchResourceTiming({ limit: 100 }),
    })

    const resources = (resourceTimingData?.data?.data || [])
        .map((event: any) => {
            try {
                const eventData = typeof event.event_data === 'string' ? JSON.parse(event.event_data) : event.event_data
                if (eventData.resources) {
                    return eventData.resources
                }
                return null
            } catch {
                return null
            }
        })
        .filter(Boolean)
        .flat()

    const slowResources = resources
        .filter((r: any) => r.isSlow)
        .sort((a: any, b: any) => b.duration - a.duration)
        .slice(0, 10)

    const thirdPartyCount = resources.filter((r: any) => r.isThirdParty).length
    const cachedCount = resources.filter((r: any) => r.cached).length
    const cacheHitRate = resources.length > 0 ? ((cachedCount / resources.length) * 100).toFixed(1) : 0

    const typeDistribution = resources.reduce((acc: any, resource: any) => {
        const type = resource.type || 'unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
    }, {})

    const typeChartData = Object.entries(typeDistribution).map(([type, count]) => ({
        type,
        count,
    }))

    const getResourceUrl = (url: string) => {
        try {
            const urlObj = new URL(url)
            return urlObj.pathname.split('/').pop() || urlObj.pathname
        } catch {
            return url
        }
    }

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            script: 'text-blue-600',
            stylesheet: 'text-purple-600',
            image: 'text-green-600',
            font: 'text-orange-600',
            fetch: 'text-red-600',
            xhr: 'text-yellow-600',
        }
        return colors[type] || 'text-gray-600'
    }

    return (
        <div className="flex-1 flex-col">
            <header className="flex items-center justify-between h-[36px] mb-4">
                <h1 className="flex flex-row items-center text-xl font-semibold">
                    <Timer className="h-6 w-6 mr-2" />
                    资源加载性能
                </h1>
            </header>

            <div className="grid gap-4 mb-4 md:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle>总资源数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{resources.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>慢资源</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{slowResources.length}</div>
                        <p className="text-xs text-muted-foreground">耗时 &gt; 3s</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>第三方资源</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{thirdPartyCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>缓存命中率</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cacheHitRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            {cachedCount} / {resources.length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 mb-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>资源类型分布</CardTitle>
                        <CardDescription>按资源类型统计数量</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            className="w-full h-64"
                            config={{
                                count: {
                                    color: 'hsl(var(--chart-4))',
                                },
                            }}
                        >
                            <BarChart data={typeChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="type" />
                                <YAxis />
                                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>慢资源 Top 10</CardTitle>
                        <CardDescription>加载时间最长的资源</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {slowResources.length === 0 ? (
                                <p className="text-sm text-muted-foreground">暂无慢资源</p>
                            ) : (
                                slowResources.map((resource: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <span className="truncate max-w-[250px]">{getResourceUrl(resource.url)}</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={getTypeColor(resource.type)}>
                                                {resource.type}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">{resource.duration}ms</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>资源加载时序分析</CardTitle>
                    <CardDescription>详细分析资源加载各阶段耗时（DNS/TCP/SSL/TTFB/Download）</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>资源</TableHead>
                                <TableHead>类型</TableHead>
                                <TableHead>总耗时</TableHead>
                                <TableHead>DNS</TableHead>
                                <TableHead>TCP</TableHead>
                                <TableHead>SSL</TableHead>
                                <TableHead>TTFB</TableHead>
                                <TableHead>下载</TableHead>
                                <TableHead>缓存</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-4">
                                        加载中...
                                    </TableCell>
                                </TableRow>
                            ) : resources.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-4">
                                        暂无数据
                                    </TableCell>
                                </TableRow>
                            ) : (
                                resources.slice(0, 50).map((resource: any, index: number) => {
                                    const breakdown = resource.breakdown || {}
                                    return (
                                        <TableRow key={index}>
                                            <TableCell className="max-w-[300px] truncate" title={resource.url}>
                                                {getResourceUrl(resource.url)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getTypeColor(resource.type)}>
                                                    {resource.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{resource.duration}ms</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{breakdown.dns || 0}ms</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{breakdown.tcp || 0}ms</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{breakdown.ssl || 0}ms</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{breakdown.ttfb || 0}ms</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{breakdown.download || 0}ms</TableCell>
                                            <TableCell>
                                                {resource.cached ? (
                                                    <Badge variant="secondary">缓存</Badge>
                                                ) : (
                                                    <Badge variant="outline">网络</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
