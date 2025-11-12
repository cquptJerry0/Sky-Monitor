/**
 * 错误列表页（错误分组）
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useErrorGroups } from '@/hooks/useEventQuery'
import { useSSEStream } from '@/api/sse/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PAGINATION } from '@/utils/constants'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { RefreshCw, AlertCircle } from 'lucide-react'
import type { Event } from '@/api/types'

export default function ErrorsPage() {
    const navigate = useNavigate()
    const { currentApp } = useCurrentApp()
    const [errorType, setErrorType] = useState<string>('all')
    const [page, setPage] = useState(0)
    const [pageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE)

    // 查询错误分组
    const { data, isLoading, refetch } = useErrorGroups({
        appId: currentApp?.appId || '',
        limit: pageSize,
    })

    // SSE 实时推送错误事件
    const { items: realtimeErrors, clear: clearRealtimeErrors } = useSSEStream<Event>(
        `/events/stream/events?appId=${currentApp?.appId || ''}&type=error`,
        !!currentApp?.appId,
        50
    )

    const errorGroups = Array.isArray(data) ? data : []

    // 筛选错误类型
    const filteredGroups = errorGroups.filter((group: any) => {
        if (errorType === 'all') return true
        return group.error_type === errorType
    })

    const handleRowClick = (fingerprint: string) => {
        // 跳转到错误详情页（使用第一个错误事件的 ID）
        // 注意：这里需要查询该 fingerprint 的第一个事件
        navigate(`/errors/trends?fingerprint=${fingerprint}`)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">错误列表</h1>
                    <p className="text-muted-foreground mt-1">查看错误分组和统计</p>
                </div>
                <div className="flex items-center gap-2">
                    {realtimeErrors.length > 0 && <Badge variant="destructive">{realtimeErrors.length} 条新错误</Badge>}
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        刷新
                    </Button>
                </div>
            </div>

            {/* 筛选器 */}
            <Card>
                <CardHeader>
                    <CardTitle>筛选条件</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">错误类型</label>
                            <Select value={errorType} onValueChange={setErrorType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部</SelectItem>
                                    <SelectItem value="Error">JavaScript Error</SelectItem>
                                    <SelectItem value="TypeError">Type Error</SelectItem>
                                    <SelectItem value="ReferenceError">Reference Error</SelectItem>
                                    <SelectItem value="SyntaxError">Syntax Error</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setErrorType('all')
                                clearRealtimeErrors()
                            }}
                        >
                            重置筛选
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 错误分组列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>错误分组（共 {filteredGroups.length} 组）</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : filteredGroups.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>暂无错误</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>错误消息</TableHead>
                                    <TableHead>错误类型</TableHead>
                                    <TableHead>发生次数</TableHead>
                                    <TableHead>影响用户</TableHead>
                                    <TableHead>首次发生</TableHead>
                                    <TableHead>最后发生</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredGroups.map((group: any) => (
                                    <TableRow
                                        key={group.fingerprint}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleRowClick(group.fingerprint)}
                                    >
                                        <TableCell className="max-w-md">
                                            <div className="truncate font-medium">{group.error_message}</div>
                                            <div className="text-xs text-muted-foreground font-mono truncate mt-1">{group.fingerprint}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{group.error_type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold" style={{ color: 'hsl(var(--destructive))' }}>
                                                {group.count}
                                            </span>
                                        </TableCell>
                                        <TableCell>{group.affected_users}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(group.first_seen), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(group.last_seen), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
