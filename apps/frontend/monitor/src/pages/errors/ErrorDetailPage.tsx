/**
 * 错误详情页
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useEventDetail } from '@/hooks/useEventQuery'
import { useErrorTrends } from '@/hooks/useErrorQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SOURCEMAP_STATUS_LABELS, CHART_COLORS } from '@/utils/constants'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { transformTrendData } from '@/utils/chart'

export default function ErrorDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { data: event, isLoading } = useEventDetail(id || null)

    // 查询错误趋势（如果有 fingerprint）
    const { data: trends } = useErrorTrends({
        appId: event?.app_id || '',
        fingerprint: event?.error_fingerprint,
        window: 'hour',
        limit: 24,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">加载中...</div>
            </div>
        )
    }

    if (!event) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">错误不存在</div>
            </div>
        )
    }

    const getSourceMapStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            parsed: 'default',
            parsing: 'secondary',
            not_available: 'outline',
            failed: 'destructive',
        }
        return <Badge variant={colors[status] as any}>{SOURCEMAP_STATUS_LABELS[status] || status}</Badge>
    }

    const trendData = trends ? transformTrendData(trends) : []

    return (
        <div className="space-y-6">
            {/* 头部 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        返回
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">错误详情</h1>
                        <p className="text-muted-foreground mt-1">错误 ID: {event.id}</p>
                    </div>
                </div>
                <Badge variant="destructive">错误</Badge>
            </div>

            {/* 错误信息 */}
            <Card>
                <CardHeader>
                    <CardTitle>错误信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {event.error_message && (
                        <div>
                            <div className="text-sm font-medium text-muted-foreground mb-2">错误消息</div>
                            <div className="p-3 bg-muted rounded-md font-mono text-sm">{event.error_message}</div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {event.error_type && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2">错误类型</div>
                                <Badge variant="outline">{event.error_type}</Badge>
                            </div>
                        )}
                        {event.error_fingerprint && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2">错误指纹</div>
                                <div className="font-mono text-xs">{event.error_fingerprint}</div>
                            </div>
                        )}
                        {event.sourceMapStatus && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2">SourceMap 状态</div>
                                {getSourceMapStatusBadge(event.sourceMapStatus)}
                            </div>
                        )}
                    </div>
                    {event.error_stack && (
                        <div>
                            <div className="text-sm font-medium text-muted-foreground mb-2">
                                错误堆栈 {event.parsedStack && '（已解析）'}
                            </div>
                            <div className="p-3 bg-muted rounded-md font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-96">
                                {event.parsedStack || event.error_stack}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 错误趋势图 */}
            {trendData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>错误趋势（最近 24 小时）</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke={CHART_COLORS.ERROR}
                                    fill={CHART_COLORS.ERROR}
                                    fillOpacity={0.2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* 环境信息 */}
            <Card>
                <CardHeader>
                    <CardTitle>环境信息</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {event.url && (
                            <div className="md:col-span-2">
                                <div className="text-sm font-medium text-muted-foreground">页面 URL</div>
                                <div className="mt-1 font-mono text-sm break-all">{event.url}</div>
                            </div>
                        )}
                        {event.browser && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">浏览器</div>
                                <div className="mt-1">
                                    {event.browser} {event.browser_version}
                                </div>
                            </div>
                        )}
                        {event.os && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">操作系统</div>
                                <div className="mt-1">
                                    {event.os} {event.os_version}
                                </div>
                            </div>
                        )}
                        {event.user_id && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">用户 ID</div>
                                <div className="mt-1 font-mono text-sm">{event.user_id}</div>
                            </div>
                        )}
                        {event.timestamp && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">发生时间</div>
                                <div className="mt-1">{format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}</div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
