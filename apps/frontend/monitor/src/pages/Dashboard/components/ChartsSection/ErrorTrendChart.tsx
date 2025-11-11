import { format } from 'date-fns'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorTrendChartProps {
    data: Array<{ time: string; count: number; occurrences: number }>
}

export function ErrorTrendChart({ data }: ErrorTrendChartProps) {
    const chartData = data.map(item => ({
        time: format(new Date(item.time), 'HH:mm'),
        count: item.count,
        occurrences: item.occurrences,
    }))

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>错误趋势</CardTitle>
                <CardDescription>最近24小时错误数量变化</CardDescription>
            </CardHeader>
            <CardContent>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="time" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px',
                                }}
                                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#ef4444"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorError)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">暂无数据</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
