/**
 * 告警历史页
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useAlertHistory } from '@/hooks/useAlertQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PAGINATION } from '@/utils/constants'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export default function AlertHistoryPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [page, setPage] = useState(0)
    const [pageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE)

    // 查询告警历史
    const { data: history, isLoading } = useAlertHistory({
        ruleId: id || '',
        limit: pageSize,
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
                        <h1 className="text-2xl font-bold">告警历史</h1>
                        <p className="text-muted-foreground mt-1">规则 ID: {id}</p>
                    </div>
                </div>
            </div>

            {/* 告警历史列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            <span>告警触发历史（共 {history?.length || 0} 条）</span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : !history || history.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">暂无告警历史</div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>触发时间</TableHead>
                                        <TableHead>严重程度</TableHead>
                                        <TableHead>触发值</TableHead>
                                        <TableHead>阈值</TableHead>
                                        <TableHead>消息</TableHead>
                                        <TableHead>状态</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-sm">
                                                {format(new Date(item.triggered_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                                            </TableCell>
                                            <TableCell>{getSeverityBadge(item.severity)}</TableCell>
                                            <TableCell>
                                                <span className="font-semibold" style={{ color: 'hsl(var(--destructive))' }}>
                                                    {item.actual_value}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{item.threshold}</TableCell>
                                            <TableCell className="max-w-md truncate">{item.rule_name}</TableCell>
                                            <TableCell>
                                                {item.resolved ? (
                                                    <Badge variant="outline">已解决</Badge>
                                                ) : (
                                                    <Badge variant="destructive">未解决</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* 分页 */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    显示 {page * pageSize + 1} - {Math.min((page + 1) * pageSize, history.length)} 条，共 {history.length}{' '}
                                    条
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                                        上一页
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page >= Math.ceil(history.length / pageSize) - 1}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        下一页
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* 统计信息 */}
            {history && history.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>统计信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">总触发次数</div>
                                <div className="text-2xl font-bold mt-1">{history.length}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">未解决</div>
                                <div className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--destructive))' }}>
                                    {history.filter(h => !h.resolved).length}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">已解决</div>
                                <div className="text-2xl font-bold mt-1">{history.filter(h => h.resolved).length}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">严重告警</div>
                                <div className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--destructive))' }}>
                                    {history.filter(h => h.severity === 'critical' || h.severity === 'high').length}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
