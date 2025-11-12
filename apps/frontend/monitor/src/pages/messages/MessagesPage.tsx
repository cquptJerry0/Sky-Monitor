/**
 * Message 事件专门页面
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useEvents } from '@/hooks/useEventQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PAGINATION } from '@/utils/constants'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { RefreshCw, Search, MessageSquare, Copy, User, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function MessagesPage() {
    const navigate = useNavigate()
    const { currentApp } = useCurrentApp()
    const { toast } = useToast()
    const [searchText, setSearchText] = useState('')
    const [level, setLevel] = useState<string>('all')
    const [userId, setUserId] = useState('')
    const [page, setPage] = useState(0)
    const [pageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE)

    // 查询 Message 事件
    const { data, isLoading, refetch } = useEvents({
        appId: currentApp?.appId || '',
        eventType: 'message',
        limit: pageSize,
        offset: page * pageSize,
    })

    const messages = Array.isArray(data?.data) ? data.data : []

    // 筛选消息
    const filteredMessages = messages.filter((msg: any) => {
        // 搜索文本
        if (searchText) {
            const messageContent = msg.event_data?.message || ''
            if (!messageContent.toLowerCase().includes(searchText.toLowerCase())) {
                return false
            }
        }

        // 级别筛选
        if (level !== 'all') {
            const msgLevel = msg.event_data?.level || 'info'
            if (msgLevel !== level) {
                return false
            }
        }

        // 用户筛选
        if (userId && msg.user_id !== userId) {
            return false
        }

        return true
    })

    // 复制消息内容
    const handleCopy = (message: string, e: React.MouseEvent) => {
        e.stopPropagation()
        navigator.clipboard.writeText(message)
        toast({
            title: '已复制',
            description: '消息内容已复制到剪贴板',
        })
    }

    // 获取级别颜色
    const getLevelColor = (msgLevel: string) => {
        switch (msgLevel) {
            case 'error':
                return 'destructive'
            case 'warning':
                return 'default'
            case 'info':
                return 'secondary'
            case 'debug':
                return 'outline'
            default:
                return 'secondary'
        }
    }

    // 获取级别文本
    const getLevelText = (msgLevel: string) => {
        switch (msgLevel) {
            case 'error':
                return '错误'
            case 'warning':
                return '警告'
            case 'info':
                return '信息'
            case 'debug':
                return '调试'
            default:
                return '信息'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">消息事件</h1>
                    <p className="text-muted-foreground mt-1">查看应用消息和日志</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">消息内容搜索</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="搜索消息内容..."
                                    value={searchText}
                                    onChange={e => setSearchText(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">消息级别</label>
                            <Select value={level} onValueChange={setLevel}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部</SelectItem>
                                    <SelectItem value="error">错误</SelectItem>
                                    <SelectItem value="warning">警告</SelectItem>
                                    <SelectItem value="info">信息</SelectItem>
                                    <SelectItem value="debug">调试</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">用户 ID</label>
                            <Input placeholder="筛选用户..." value={userId} onChange={e => setUserId(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSearchText('')
                                setLevel('all')
                                setUserId('')
                            }}
                        >
                            重置筛选
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 消息列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>消息列表（共 {filteredMessages.length} 条）</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">加载中...</div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                            <div className="text-muted-foreground">暂无消息</div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>级别</TableHead>
                                    <TableHead>消息内容</TableHead>
                                    <TableHead>用户 ID</TableHead>
                                    <TableHead>会话 ID</TableHead>
                                    <TableHead>时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMessages.map((msg: any) => {
                                    const messageContent = msg.event_data?.message || '-'
                                    const msgLevel = msg.event_data?.level || 'info'

                                    return (
                                        <TableRow key={msg.id} className="cursor-pointer hover:bg-muted/50">
                                            <TableCell>
                                                <Badge variant={getLevelColor(msgLevel) as any}>{getLevelText(msgLevel)}</Badge>
                                            </TableCell>
                                            <TableCell className="max-w-md">
                                                <div className="truncate" title={messageContent}>
                                                    {messageContent}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {msg.user_id ? (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 font-mono text-xs"
                                                        onClick={() => navigate(`/users/${msg.user_id}/timeline`)}
                                                    >
                                                        <User className="h-3 w-3 mr-1" />
                                                        {msg.user_id.slice(0, 8)}...
                                                    </Button>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {msg.session_id ? (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 font-mono text-xs"
                                                        onClick={() => navigate(`/sessions/${msg.session_id}`)}
                                                    >
                                                        {msg.session_id.slice(0, 8)}...
                                                    </Button>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(msg.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm" onClick={e => handleCopy(messageContent, e)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
