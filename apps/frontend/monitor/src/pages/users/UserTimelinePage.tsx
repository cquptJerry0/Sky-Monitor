/**
 * 用户事件时间线页
 * 展示特定用户的所有事件，按时间顺序排列
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useUserEvents } from '@/hooks/useEventQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Clock, AlertCircle, Activity, Zap, User, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function UserTimelinePage() {
    const { userId } = useParams<{ userId: string }>()
    const navigate = useNavigate()
    const { currentApp } = useCurrentApp()
    const [searchUserId, setSearchUserId] = useState(userId || '')

    // 查询用户事件
    const { data, isLoading } = useUserEvents(userId || null, currentApp?.appId || null)

    const handleSearch = () => {
        if (searchUserId.trim()) {
            navigate(`/users/${searchUserId}/timeline`)
        }
    }

    // 事件类型图标映射
    const getEventIcon = (eventType: string) => {
        switch (eventType) {
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />
            case 'performance':
                return <Zap className="h-4 w-4 text-blue-500" />
            case 'webVital':
                return <Activity className="h-4 w-4 text-green-500" />
            default:
                return <Clock className="h-4 w-4 text-gray-500" />
        }
    }

    // 事件类型颜色映射
    const getEventTypeColor = (eventType: string) => {
        switch (eventType) {
            case 'error':
                return 'destructive'
            case 'performance':
                return 'default'
            case 'webVital':
                return 'secondary'
            default:
                return 'outline'
        }
    }

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">用户事件时间线</h1>
                        <p className="text-muted-foreground mt-1">追踪用户行为路径和事件历史</p>
                    </div>
                </div>
            </div>

            {/* 用户搜索 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        用户查询
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            placeholder="输入用户 ID 或用户名..."
                            value={searchUserId}
                            onChange={e => setSearchUserId(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="flex-1"
                        />
                        <Button onClick={handleSearch}>
                            <Search className="h-4 w-4 mr-2" />
                            查询
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 用户信息卡片 */}
            {userId && (
                <Card>
                    <CardHeader>
                        <CardTitle>用户信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground">用户 ID</div>
                                <div className="font-medium mt-1">{userId}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">事件总数</div>
                                <div className="font-medium mt-1">{data?.data?.length || 0}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">错误事件</div>
                                <div className="font-medium mt-1 text-red-500">
                                    {data?.data?.filter(e => e.event_type === 'error').length || 0}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">性能事件</div>
                                <div className="font-medium mt-1 text-blue-500">
                                    {data?.data?.filter(e => e.event_type === 'performance').length || 0}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 事件时间线 */}
            <Card>
                <CardHeader>
                    <CardTitle>事件时间线</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-muted-foreground">加载中...</div>
                        </div>
                    ) : !data?.data || data.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <User className="h-12 w-12 text-muted-foreground mb-4" />
                            <div className="text-muted-foreground">暂无事件数据</div>
                            <p className="text-sm text-muted-foreground mt-2">请输入用户 ID 进行查询</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.data.map((event, index) => (
                                <div
                                    key={event.id}
                                    className="flex gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/events/${event.id}`)}
                                >
                                    {/* 时间线指示器 */}
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border-2">
                                            {getEventIcon(event.event_type)}
                                        </div>
                                        {index < data.data.length - 1 && <div className="w-0.5 flex-1 bg-border mt-2" />}
                                    </div>

                                    {/* 事件内容 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant={getEventTypeColor(event.event_type) as any}>{event.event_type}</Badge>
                                                <span className="font-medium">{event.event_name || '未命名事件'}</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(event.timestamp), {
                                                    addSuffix: true,
                                                    locale: zhCN,
                                                })}
                                            </div>
                                        </div>

                                        {/* 事件详情 */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                            {event.path && (
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <span className="font-medium">路径:</span>
                                                    <span className="truncate">{event.path}</span>
                                                </div>
                                            )}
                                            {event.session_id && (
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <span className="font-medium">会话:</span>
                                                    <span
                                                        className="truncate hover:text-primary cursor-pointer"
                                                        onClick={e => {
                                                            e.stopPropagation()
                                                            navigate(`/sessions/${event.session_id}`)
                                                        }}
                                                    >
                                                        {event.session_id.slice(0, 8)}...
                                                    </span>
                                                </div>
                                            )}
                                            {event.error_message && (
                                                <div className="flex items-center gap-1 text-muted-foreground col-span-full">
                                                    <span className="font-medium">错误:</span>
                                                    <span className="truncate text-red-500">{event.error_message}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* 时间戳 */}
                                        <div className="text-xs text-muted-foreground mt-2">
                                            {new Date(event.timestamp).toLocaleString('zh-CN')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
