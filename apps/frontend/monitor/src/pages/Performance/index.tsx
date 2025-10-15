import { Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, Rectangle, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ApplicationType } from '@/types/api'

import { appLogoMap } from '../Projects/meta'

export interface Performance {
    id: number
    path: string
    appType: ApplicationType
    appName: string
    users: number
}

const MOCK_PERFORMANCE: Performance[] = [
    {
        id: 1,
        path: '/',
        appType: 'react',
        appName: 'Sky Monitor React 应用',
        users: 2,
    },
    {
        id: 2,
        path: '/dashboard',
        appType: 'vue',
        appName: 'Sky Monitor Vue 应用',
        users: 1,
    },
    {
        id: 3,
        path: '/issues',
        appType: 'vanilla',
        appName: 'Sky Monitor JavaScript 应用',
        users: 3,
    },
]

const durations = Array.from({ length: 140 }, (_, i) => ({
    ms: i,
    count: Math.floor(Math.random() * (100 - 20) + 20),
}))

export function Performance() {
    const generateSummaryPath = (queryParams: { project: string; appType: ApplicationType; transaction: string }) => {
        const query = new URLSearchParams(queryParams).toString()
        return `summary?${query.toString()}`
    }
    return (
        <div className="flex-1 flex-col">
            <header className="flex items-center justify-between h-[36px] mb-4">
                <h1 className="flex flex-row items-center text-xl font-semibold">
                    <Zap className="h-6 w-6 mr-2" />
                    性能
                </h1>
            </header>
            <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-4">
                    <Card className="flex flex-col flex-grow">
                        <CardHeader>
                            <CardTitle className="flex flex-row items-center">时长分布</CardTitle>
                            <CardDescription>通过时长分布图，您可以清晰看到资源记载情况</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                className="w-full h-64"
                                config={{
                                    steps: {
                                        color: `hsl(var(--chart-1))`,
                                    },
                                }}
                            >
                                <BarChart accessibilityLayer data={durations}>
                                    <Bar
                                        dataKey="count"
                                        fill="var(--color-steps)"
                                        radius={5}
                                        fillOpacity={0.6}
                                        activeBar={<Rectangle fillOpacity={0.8} />}
                                    />
                                    <YAxis dataKey="count" tickLine={false} axisLine={false} width={28} />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                labelFormatter={(_, payload) => {
                                                    const ms = payload[0]?.payload?.ms
                                                    return ms !== undefined ? `${ms}ms` : '-'
                                                }}
                                            />
                                        }
                                    />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card className="flex flex-col flex-grow">
                        <CardHeader>
                            <CardTitle className="flex flex-row items-center">P50 时长分布</CardTitle>
                            <CardDescription>通过 P50 时长统计，您可以查看应用的性能数据。</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                className="w-full h-64"
                                config={{
                                    time: {
                                        label: 'Time',
                                        color: 'hsl(var(--chart-4))',
                                    },
                                }}
                            >
                                <AreaChart
                                    accessibilityLayer
                                    data={durations}
                                    margin={{
                                        left: 0,
                                        right: 0,
                                        top: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <YAxis
                                        dataKey="count"
                                        tickLine={false}
                                        axisLine={false}
                                        width={28}
                                        domain={['dataMin - 5', 'dataMax + 2']}
                                    />
                                    <defs>
                                        <linearGradient id="fillTime" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-time)" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="var(--color-time)" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        dataKey="count"
                                        type="natural"
                                        fill="url(#fillTime)"
                                        fillOpacity={0.4}
                                        stroke="var(--color-time)"
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                labelFormatter={(_, payload) => {
                                                    const ms = payload[0]?.payload?.ms
                                                    return ms !== undefined ? `${ms}ms` : '-'
                                                }}
                                            />
                                        }
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
                <Card x-chunk="dashboard-06-chunk-0">
                    <CardHeader>
                        <CardTitle className="flex flex-row items-center">性能监控</CardTitle>
                        <CardDescription>通过性能监控，您可以查看应用的性能数据。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>事务</TableHead>
                                    <TableHead>项目</TableHead>
                                    <TableHead>用户</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {MOCK_PERFORMANCE.map(performance => (
                                    <TableRow key={performance.id}>
                                        <TableCell className="font-medium py-4">
                                            <Link
                                                to={generateSummaryPath({
                                                    project: `${performance.id}`,
                                                    appType: performance.appType,
                                                    transaction: performance.path,
                                                })}
                                                className="text-sm text-blue-500"
                                            >
                                                {performance.path}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-row items-center gap-1">
                                                <img src={appLogoMap[performance.appType]} alt="React" className="w-4 h-4 rounded" />
                                                <p className="text-xs text-gray-500">{performance.appName}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{performance.users}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
