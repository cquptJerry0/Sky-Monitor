/**
 * 错误突增页
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useRecentSpikes } from '@/hooks/useErrorQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react'

export default function ErrorSpikesPage() {
    const navigate = useNavigate()
    const { currentApp } = useCurrentApp()
    const [window, setWindow] = useState<'hour' | 'day'>('hour')
    const [threshold, setThreshold] = useState(2)

    // 查询错误突增
    const {
        data: spikes,
        isLoading,
        refetch,
    } = useRecentSpikes({
        appId: currentApp?.appId || '',
        limit: 50,
    })

    const getSeverityBadge = (severity: string) => {
        const variants: Record<string, any> = {
            critical: 'destructive',
            high: 'destructive',
            medium: 'secondary',
            low: 'outline',
        }
        const labels: Record<string, string> = {
            critical: '严重',
            high: '高',
            medium: '中',
            low: '低',
        }
        return <Badge variant={variants[severity] || 'outline'}>{labels[severity] || severity}</Badge>
    }

    const handleRowClick = (fingerprint: string) => {
        navigate(`/errors/trends?fingerprint=${fingerprint}`)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">错误突增检测</h1>
                    <p className="text-muted-foreground mt-1">实时检测错误突增情况</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    刷新
                </Button>
            </div>

            {/* 筛选器 */}
            <Card>
                <CardHeader>
                    <CardTitle>筛选条件</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">时间窗口</label>
                            <Select value={window} onValueChange={(v: any) => setWindow(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hour">按小时</SelectItem>
                                    <SelectItem value="day">按天</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">突增阈值（倍数）</label>
                            <Select value={threshold.toString()} onValueChange={v => setThreshold(Number(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1.5">1.5x</SelectItem>
                                    <SelectItem value="2">2x</SelectItem>
                                    <SelectItem value="3">3x</SelectItem>
                                    <SelectItem value="5">5x</SelectItem>
                                    <SelectItem value="10">10x</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 突增列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            <span>错误突增列表（共 {spikes?.length || 0} 条）</span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : !spikes || spikes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>暂无错误突增</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>错误消息</TableHead>
                                    <TableHead>错误类型</TableHead>
                                    <TableHead>严重程度</TableHead>
                                    <TableHead>当前数量</TableHead>
                                    <TableHead>基线数量</TableHead>
                                    <TableHead>增长倍数</TableHead>
                                    <TableHead>检测时间</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {spikes.map(spike => (
                                    <TableRow
                                        key={spike.fingerprint}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleRowClick(spike.fingerprint)}
                                    >
                                        <TableCell className="max-w-md">
                                            <div className="truncate font-medium">{spike.error_message}</div>
                                            <div className="text-xs text-muted-foreground font-mono truncate mt-1">{spike.fingerprint}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">错误</Badge>
                                        </TableCell>
                                        <TableCell>{getSeverityBadge(spike.severity)}</TableCell>
                                        <TableCell>
                                            <span className="font-semibold" style={{ color: 'hsl(var(--destructive))' }}>
                                                {spike.current_count}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{spike.baseline_count}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{spike.increase_rate.toFixed(1)}x</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(spike.detected_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* 统计信息 */}
            {spikes && spikes.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>统计信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">总突增数</div>
                                <div className="text-2xl font-bold mt-1">{spikes.length}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">严重突增</div>
                                <div className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--destructive))' }}>
                                    {spikes.filter(s => s.severity === 'critical' || s.severity === 'high').length}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">平均增长倍数</div>
                                <div className="text-2xl font-bold mt-1">
                                    {(spikes.reduce((sum, s) => sum + s.increase_rate, 0) / spikes.length).toFixed(1)}x
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">最大增长倍数</div>
                                <div className="text-2xl font-bold mt-1">{Math.max(...spikes.map(s => s.increase_rate)).toFixed(1)}x</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
