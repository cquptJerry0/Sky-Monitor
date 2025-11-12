/**
 * 事件详情页
 */

import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEventDetail } from '@/hooks/useEventQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { EVENT_TYPE_LABELS, SOURCEMAP_STATUS_LABELS } from '@/utils/constants'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import type { EventType } from '@/api/types'

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { data: event, isLoading } = useEventDetail(id || null)

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
                <div className="text-muted-foreground">事件不存在</div>
            </div>
        )
    }

    const getEventTypeBadge = (type: EventType) => {
        const colors: Record<string, string> = {
            error: 'destructive',
            httpError: 'destructive',
            resourceError: 'destructive',
            performance: 'default',
            webVital: 'secondary',
            session: 'outline',
        }
        return <Badge variant={colors[type] as any}>{EVENT_TYPE_LABELS[type] || type}</Badge>
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
                        <h1 className="text-2xl font-bold">事件详情</h1>
                        <p className="text-muted-foreground mt-1">事件 ID: {event.id}</p>
                    </div>
                </div>
                {getEventTypeBadge(event.event_type)}
            </div>

            {/* 基本信息 */}
            <Card>
                <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">事件类型</div>
                            <div className="mt-1">{getEventTypeBadge(event.event_type)}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">时间戳</div>
                            <div className="mt-1">{format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">应用 ID</div>
                            <div className="mt-1 font-mono text-sm">{event.app_id}</div>
                        </div>
                        {event.session_id && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">会话 ID</div>
                                <div className="mt-1">
                                    <Link
                                        to={`/sessions/${event.session_id}`}
                                        className="text-primary hover:underline flex items-center gap-1"
                                    >
                                        <span className="font-mono text-sm">{event.session_id}</span>
                                        <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 错误信息 */}
            {(event.error_message || event.error_stack) && (
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
                        {event.error_type && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2">错误类型</div>
                                <div className="font-mono text-sm">{event.error_type}</div>
                            </div>
                        )}
                        {event.error_fingerprint && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2">错误指纹</div>
                                <div className="font-mono text-sm">{event.error_fingerprint}</div>
                            </div>
                        )}
                        {event.sourceMapStatus && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2">SourceMap 状态</div>
                                <div>{getSourceMapStatusBadge(event.sourceMapStatus)}</div>
                            </div>
                        )}
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
            )}

            {/* 性能信息 */}
            {(event.performance_metric || event.web_vital_name) && (
                <Card>
                    <CardHeader>
                        <CardTitle>性能信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {event.performance_metric && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">性能指标</div>
                                    <div className="mt-1">{event.performance_metric}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">指标值</div>
                                    <div className="mt-1">{event.performance_value?.toFixed(2)} ms</div>
                                </div>
                            </div>
                        )}
                        {event.web_vital_name && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">Web Vital 指标</div>
                                    <div className="mt-1">{event.web_vital_name}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">指标值</div>
                                    <div className="mt-1">{event.web_vital_value?.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">评级</div>
                                    <div className="mt-1">
                                        <Badge
                                            variant={
                                                event.web_vital_rating === 'good'
                                                    ? 'default'
                                                    : event.web_vital_rating === 'needs-improvement'
                                                      ? 'secondary'
                                                      : 'destructive'
                                            }
                                        >
                                            {event.web_vital_rating}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* 用户信息 */}
            {(event.user_id || event.user_email || event.user_name) && (
                <Card>
                    <CardHeader>
                        <CardTitle>用户信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {event.user_id && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">用户 ID</div>
                                    <div className="mt-1 font-mono text-sm">{event.user_id}</div>
                                </div>
                            )}
                            {event.user_email && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">邮箱</div>
                                    <div className="mt-1">{event.user_email}</div>
                                </div>
                            )}
                            {event.user_name && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">用户名</div>
                                    <div className="mt-1">{event.user_name}</div>
                                </div>
                            )}
                        </div>
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
                        {event.device_type && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">设备类型</div>
                                <div className="mt-1">{event.device_type}</div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 原始数据 */}
            {event.event_data && (
                <Card>
                    <CardHeader>
                        <CardTitle>原始数据</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-3 bg-muted rounded-md font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-96">
                            {typeof event.event_data === 'string' ? event.event_data : JSON.stringify(event.event_data, null, 2)}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
