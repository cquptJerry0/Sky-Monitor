/**
 * Transaction 事件列表页
 * 展示所有 Transaction 事件，用于追踪完整的用户操作流程
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useTransactions } from '@/hooks/useEventQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Activity, Search, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function TransactionsPage() {
    const navigate = useNavigate()
    const { currentApp } = useCurrentApp()
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')

    // 查询 Transaction 事件
    const { data, isLoading } = useTransactions(currentApp?.appId || null)

    // 过滤事件
    const filteredTransactions = data?.data?.filter(event => {
        const matchesSearch =
            !searchQuery ||
            event.event_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.event_data?.toString().toLowerCase().includes(searchQuery.toLowerCase())

        const eventData = typeof event.event_data === 'string' ? JSON.parse(event.event_data) : event.event_data
        const status = eventData?.status || 'unknown'

        const matchesStatus = statusFilter === 'all' || status === statusFilter

        return matchesSearch && matchesStatus
    })

    // 获取状态图标
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ok':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500" />
            case 'cancelled':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />
            default:
                return <Clock className="h-4 w-4 text-gray-500" />
        }
    }

    // 获取状态颜色
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ok':
                return 'default'
            case 'error':
                return 'destructive'
            case 'cancelled':
                return 'secondary'
            default:
                return 'outline'
        }
    }

    // 计算持续时间
    const calculateDuration = (eventData: any) => {
        if (eventData?.startTimestamp && eventData?.endTimestamp) {
            return ((eventData.endTimestamp - eventData.startTimestamp) / 1000).toFixed(2)
        }
        return 'N/A'
    }

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div>
                <h1 className="text-2xl font-bold">Transaction 追踪</h1>
                <p className="text-muted-foreground mt-1">追踪完整的用户操作流程和业务事务</p>
            </div>

            {/* 过滤器 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        筛选条件
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="搜索 Transaction 名称..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="选择状态" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部状态</SelectItem>
                                <SelectItem value="ok">成功</SelectItem>
                                <SelectItem value="error">错误</SelectItem>
                                <SelectItem value="cancelled">已取消</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline">
                            <Search className="h-4 w-4 mr-2" />
                            搜索
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Transaction 列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>Transaction 列表</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-muted-foreground">加载中...</div>
                        </div>
                    ) : !filteredTransactions || filteredTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                            <div className="text-muted-foreground">暂无 Transaction 数据</div>
                            <p className="text-sm text-muted-foreground mt-2">SDK 尚未上报任何 Transaction 事件</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTransactions.map(event => {
                                const eventData = typeof event.event_data === 'string' ? JSON.parse(event.event_data) : event.event_data
                                const status = eventData?.status || 'unknown'
                                const op = eventData?.op || 'unknown'
                                const spanCount = eventData?.spans?.length || 0
                                const duration = calculateDuration(eventData)

                                return (
                                    <div
                                        key={event.id}
                                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/transactions/${event.id}`)}
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            {getStatusIcon(status)}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium truncate">{event.event_name || '未命名 Transaction'}</span>
                                                    <Badge variant={getStatusColor(status) as any}>{status}</Badge>
                                                    <Badge variant="outline">{op}</Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {duration}s
                                                    </span>
                                                    <span>{spanCount} spans</span>
                                                    {event.user_id && <span>用户: {event.user_id}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                                            {formatDistanceToNow(new Date(event.timestamp), {
                                                addSuffix: true,
                                                locale: zhCN,
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 统计信息 */}
            {filteredTransactions && filteredTransactions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">总 Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">成功</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">
                                {
                                    filteredTransactions.filter(e => {
                                        const data = typeof e.event_data === 'string' ? JSON.parse(e.event_data) : e.event_data
                                        return data?.status === 'ok'
                                    }).length
                                }
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">错误</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">
                                {
                                    filteredTransactions.filter(e => {
                                        const data = typeof e.event_data === 'string' ? JSON.parse(e.event_data) : e.event_data
                                        return data?.status === 'error'
                                    }).length
                                }
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">平均耗时</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(
                                    filteredTransactions.reduce((sum, e) => {
                                        const data = typeof e.event_data === 'string' ? JSON.parse(e.event_data) : e.event_data
                                        const duration =
                                            data?.startTimestamp && data?.endTimestamp ? data.endTimestamp - data.startTimestamp : 0
                                        return sum + duration
                                    }, 0) /
                                    filteredTransactions.length /
                                    1000
                                ).toFixed(2)}
                                s
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
