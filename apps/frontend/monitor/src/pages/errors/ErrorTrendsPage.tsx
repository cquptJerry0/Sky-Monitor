/**
 * 错误趋势页
 */

import { useState } from 'react'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useErrorTrends, useCompareErrorTrends } from '@/hooks/useErrorQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CHART_COLORS } from '@/utils/constants'
import { transformTrendData } from '@/utils/chart'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Plus, X } from 'lucide-react'

export default function ErrorTrendsPage() {
    const { currentApp } = useCurrentApp()
    const [window, setWindow] = useState<'hour' | 'day' | 'week'>('hour')
    const [fingerprint, setFingerprint] = useState('')
    const [compareFingerprints, setCompareFingerprints] = useState<string[]>([])
    const [newFingerprint, setNewFingerprint] = useState('')

    // 查询主趋势
    const { data: mainTrends, isLoading: mainLoading } = useErrorTrends({
        appId: currentApp?.appId || '',
        fingerprint: fingerprint || undefined,
        window,
        limit: window === 'hour' ? 24 : window === 'day' ? 30 : 12,
    })

    // 查询对比趋势
    const { data: compareTrends, isLoading: compareLoading } = useCompareErrorTrends({
        appId: currentApp?.appId || '',
        fingerprints: compareFingerprints,
        window,
        limit: window === 'hour' ? 24 : window === 'day' ? 30 : 12,
    })

    const mainData = mainTrends ? transformTrendData(mainTrends) : []
    const compareData = Array.isArray(compareTrends) ? compareTrends : []

    // 合并数据用于图表展示
    const mergedData = mainData.map((item, index) => {
        const result: any = { ...item, main: item.count }
        if (Array.isArray(compareData)) {
            compareData.forEach((compare: any, idx: number) => {
                if (compare.trends && compare.trends[index]) {
                    result[`compare${idx}`] = compare.trends[index].count
                }
            })
        }
        return result
    })

    const handleAddCompare = () => {
        if (newFingerprint && !compareFingerprints.includes(newFingerprint)) {
            setCompareFingerprints([...compareFingerprints, newFingerprint])
            setNewFingerprint('')
        }
    }

    const handleRemoveCompare = (fp: string) => {
        setCompareFingerprints(compareFingerprints.filter(f => f !== fp))
    }

    const colors = [CHART_COLORS.PRIMARY, CHART_COLORS.SUCCESS, CHART_COLORS.WARNING, CHART_COLORS.INFO, CHART_COLORS.PURPLE]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">错误趋势</h1>
                <p className="text-muted-foreground mt-1">查看错误发生趋势和对比分析</p>
            </div>

            {/* 筛选器 */}
            <Card>
                <CardHeader>
                    <CardTitle>筛选条件</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">时间窗口</label>
                            <Select value={window} onValueChange={(v: any) => setWindow(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hour">按小时（最近 24 小时）</SelectItem>
                                    <SelectItem value="day">按天（最近 30 天）</SelectItem>
                                    <SelectItem value="week">按周（最近 12 周）</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">错误指纹（主趋势）</label>
                            <Input placeholder="输入错误指纹..." value={fingerprint} onChange={e => setFingerprint(e.target.value)} />
                        </div>
                    </div>

                    {/* 对比错误 */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">对比错误（最多 4 个）</label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                placeholder="输入错误指纹..."
                                value={newFingerprint}
                                onChange={e => setNewFingerprint(e.target.value)}
                                disabled={compareFingerprints.length >= 4}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddCompare}
                                disabled={!newFingerprint || compareFingerprints.length >= 4}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                添加
                            </Button>
                        </div>
                        {compareFingerprints.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {compareFingerprints.map((fp, idx) => (
                                    <Badge key={fp} variant="secondary" className="flex items-center gap-1">
                                        <span className="font-mono text-xs">{fp.slice(0, 12)}...</span>
                                        <button onClick={() => handleRemoveCompare(fp)} className="ml-1">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 趋势图 */}
            <Card>
                <CardHeader>
                    <CardTitle>错误趋势图</CardTitle>
                </CardHeader>
                <CardContent>
                    {mainLoading || compareLoading ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : mergedData.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">暂无数据</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={mergedData}>
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
                                <Legend />
                                {fingerprint && (
                                    <Area
                                        type="monotone"
                                        dataKey="main"
                                        name="主趋势"
                                        stroke={CHART_COLORS.ERROR}
                                        fill={CHART_COLORS.ERROR}
                                        fillOpacity={0.2}
                                    />
                                )}
                                {Array.isArray(compareData) &&
                                    compareData.map((compare: any, idx: number) => (
                                        <Area
                                            key={compare.fingerprint}
                                            type="monotone"
                                            dataKey={`compare${idx}`}
                                            name={`对比 ${idx + 1}`}
                                            stroke={colors[idx % colors.length]}
                                            fill={colors[idx % colors.length]}
                                            fillOpacity={0.2}
                                        />
                                    ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* 统计信息 */}
            {mainTrends && mainTrends.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>统计信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">总错误数</div>
                                <div className="text-2xl font-bold mt-1">{mainTrends.reduce((sum, t) => sum + t.count, 0)}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">平均错误数</div>
                                <div className="text-2xl font-bold mt-1">
                                    {(mainTrends.reduce((sum, t) => sum + t.count, 0) / mainTrends.length).toFixed(1)}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">峰值错误数</div>
                                <div className="text-2xl font-bold mt-1">{Math.max(...mainTrends.map(t => t.count))}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">数据点数</div>
                                <div className="text-2xl font-bold mt-1">{mainTrends.length}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
