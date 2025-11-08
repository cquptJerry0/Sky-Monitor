import { useQuery } from '@tanstack/react-query'
import { formatDate } from 'date-fns'
import { FileX2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fetchResourceErrors } from '@/services'

export function ResourceErrors() {
    const { data: resourceErrorsData, isLoading } = useQuery({
        queryKey: ['resourceErrors'],
        queryFn: () => fetchResourceErrors({ limit: 100 }),
    })

    const resourceErrors = resourceErrorsData?.data?.data || []

    const errorsByType = resourceErrors.reduce(
        (acc, error) => {
            const type = error.resource_type || 'unknown'
            acc[type] = (acc[type] || 0) + 1
            return acc
        },
        {} as Record<string, number>
    )

    const typeChartData = Object.entries(errorsByType).map(([type, count]) => ({
        type,
        count,
    }))

    const getResourceTypeBadge = (type: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            script: 'destructive',
            img: 'secondary',
            link: 'default',
            video: 'outline',
            audio: 'outline',
        }
        return variants[type] || 'outline'
    }

    return (
        <div className="flex-1 flex-col">
            <header className="flex items-center justify-between h-[36px] mb-4">
                <h1 className="flex flex-row items-center text-xl font-semibold">
                    <FileX2 className="h-6 w-6 mr-2" />
                    资源加载错误
                </h1>
            </header>

            <div className="grid gap-4 mb-4 md:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle>总错误数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{resourceErrors.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>脚本错误</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{errorsByType['script'] || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>图片错误</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{errorsByType['img'] || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>样式错误</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{errorsByType['link'] || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>按类型分组统计</CardTitle>
                    <CardDescription>资源加载失败按类型分布</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        className="w-full h-64"
                        config={{
                            count: {
                                color: 'hsl(var(--chart-2))',
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
                    <CardTitle>资源错误列表</CardTitle>
                    <CardDescription>监控静态资源加载失败（图片、脚本、样式等）</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>资源URL</TableHead>
                                <TableHead>类型</TableHead>
                                <TableHead>错误消息</TableHead>
                                <TableHead>时间</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4">
                                        加载中...
                                    </TableCell>
                                </TableRow>
                            ) : resourceErrors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4">
                                        暂无数据
                                    </TableCell>
                                </TableRow>
                            ) : (
                                resourceErrors.slice(0, 50).map(error => (
                                    <TableRow key={error.id}>
                                        <TableCell className="max-w-[400px] truncate">{error.resource_url}</TableCell>
                                        <TableCell>
                                            <Badge variant={getResourceTypeBadge(error.resource_type)}>{error.resource_type}</Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                                            {error.error_message}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {formatDate(new Date(error.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
