import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingDown, Users, Activity, Clock } from 'lucide-react'
import { format } from 'date-fns'

import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import * as errorService from '@/services/errors'
import { ErrorGroup } from '@/types/api'

import { ErrorDetailDialog } from './ErrorDetailDialog'

export function ErrorGroups() {
    const [selectedAppId, setSelectedAppId] = useState<string>('all')
    const [threshold, setThreshold] = useState<number>(0.8)
    const [selectedGroup, setSelectedGroup] = useState<ErrorGroup | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const { data: groupsData, isLoading } = useQuery({
        queryKey: ['error-groups', selectedAppId, threshold],
        queryFn: () =>
            errorService.fetchSmartErrorGroups({
                appId: selectedAppId,
                threshold,
                limit: 100,
            }),
        refetchInterval: 60000,
    })

    const groups = groupsData?.data?.groups || []
    const originalGroups = groupsData?.data?.original_groups || 0
    const mergedGroups = groupsData?.data?.merged_groups || 0
    const reductionRate = groupsData?.data?.reduction_rate || 0

    const totalErrors = groups.reduce((acc, g) => acc + g.total_count, 0)
    const totalAffectedUsers = groups.reduce((acc, g) => acc + g.affected_users, 0)

    const handleGroupClick = (group: ErrorGroup) => {
        setSelectedGroup(group)
        setDialogOpen(true)
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">智能错误聚合</h1>
                    <p className="text-muted-foreground mt-1">基于相似度算法自动聚合相似错误</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">相似度阈值:</span>
                    <select
                        value={threshold}
                        onChange={e => setThreshold(Number(e.target.value))}
                        className="border rounded-md px-3 py-2 text-sm"
                    >
                        <option value={0.7}>70%</option>
                        <option value={0.8}>80%</option>
                        <option value={0.9}>90%</option>
                    </select>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="原始错误组" value={originalGroups} icon={Activity} description="聚合前的错误组数" />
                <StatCard title="合并后" value={mergedGroups} icon={TrendingDown} description="聚合后的错误组数" />
                <StatCard
                    title="聚合率"
                    value={`${(reductionRate * 100).toFixed(1)}%`}
                    icon={TrendingDown}
                    description="减少的错误组占比"
                />
                <StatCard title="影响用户" value={totalAffectedUsers} icon={Users} description="总受影响用户数" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>错误聚合组 ({groups.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : groups.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">暂无聚合数据</div>
                    ) : (
                        <div className="space-y-4">
                            {groups.map((group, index) => (
                                <Card
                                    key={group.fingerprint}
                                    className="hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => handleGroupClick(group)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                                                    <Badge
                                                        variant={group.representative_error.level === 'error' ? 'destructive' : 'default'}
                                                    >
                                                        {group.representative_error.level}
                                                    </Badge>
                                                    <Badge variant="outline">{group.total_count} 次发生</Badge>
                                                </div>

                                                <h3 className="font-medium mb-1 truncate">{group.representative_error.message}</h3>

                                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {group.affected_users} 用户
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Activity className="h-3 w-3" />
                                                        {group.affected_sessions} 会话
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        首次: {format(new Date(group.first_seen), 'MM-dd HH:mm')}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        最近: {format(new Date(group.last_seen), 'MM-dd HH:mm')}
                                                    </div>
                                                </div>

                                                <Separator className="my-3" />

                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">错误指纹</p>
                                                    <code className="text-xs bg-muted px-2 py-1 rounded">{group.fingerprint}</code>
                                                </div>
                                            </div>

                                            <Button variant="outline" size="sm" onClick={() => handleGroupClick(group)}>
                                                查看详情
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedGroup && (
                <ErrorDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} error={selectedGroup.representative_error} />
            )}
        </div>
    )
}
