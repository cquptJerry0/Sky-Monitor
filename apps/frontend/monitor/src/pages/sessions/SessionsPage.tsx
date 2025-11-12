/**
 * 会话列表页
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useSessions } from '@/hooks/useEventQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PAGINATION } from '@/utils/constants'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { RefreshCw, Search, Play } from 'lucide-react'

export default function SessionsPage() {
    const navigate = useNavigate()
    const { currentApp } = useCurrentApp()
    const [searchUserId, setSearchUserId] = useState('')
    const [page, setPage] = useState(0)
    const [pageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE)

    // 查询会话列表
    const { data, isLoading, refetch } = useSessions({
        appId: currentApp?.appId || '',
        limit: pageSize,
        offset: page * pageSize,
    })

    const sessions = Array.isArray(data) ? data : []

    // 筛选用户 ID
    const filteredSessions = sessions.filter((session: { user_id?: string }) => {
        if (searchUserId && !session.user_id?.toLowerCase().includes(searchUserId.toLowerCase())) {
            return false
        }
        return true
    })

    const handleRowClick = (sessionId: string) => {
        navigate(`/sessions/${sessionId}`)
    }

    const handleReplayClick = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        navigate(`/sessions/${sessionId}/replay`)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">会话列表</h1>
                    <p className="text-muted-foreground mt-1">查看用户会话和行为记录</p>
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
                            <label className="text-sm font-medium mb-2 block">用户 ID 搜索</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="搜索用户 ID..."
                                    value={searchUserId}
                                    onChange={e => setSearchUserId(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => setSearchUserId('')}>
                            重置筛选
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 会话列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>会话列表（共 {filteredSessions.length} 条）</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">暂无会话</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>会话 ID</TableHead>
                                    <TableHead>用户 ID</TableHead>
                                    <TableHead>事件数</TableHead>
                                    <TableHead>持续时间</TableHead>
                                    <TableHead>开始时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSessions.map((session: any) => (
                                    <TableRow
                                        key={session.session_id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleRowClick(session.session_id)}
                                    >
                                        <TableCell className="font-mono text-sm">{session.session_id.slice(0, 12)}...</TableCell>
                                        <TableCell>{session.user_id || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{session.event_count}</Badge>
                                        </TableCell>
                                        <TableCell>{session.duration ? `${(session.duration / 1000).toFixed(1)}s` : '-'}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(session.start_time), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" onClick={e => handleReplayClick(session.session_id, e)}>
                                                <Play className="h-4 w-4 mr-1" />
                                                回放
                                            </Button>
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
