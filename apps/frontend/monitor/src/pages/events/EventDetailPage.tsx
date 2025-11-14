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
import { ArrowLeft, ExternalLink, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
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

                        <Separator className="my-4" />

                        {/* SourceMap 解析中提示 */}
                        {event.sourceMapStatus === 'parsing' && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-yellow-600 dark:text-yellow-400" />
                                    <span className="text-sm text-yellow-700 dark:text-yellow-300">
                                        SourceMap 正在解析中，请稍后刷新页面...
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* SourceMap 解析失败提示 */}
                        {event.sourceMapStatus === 'failed' && (
                            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                    <div className="text-sm text-red-700 dark:text-red-300">
                                        <div className="font-medium mb-1">SourceMap 解析失败</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 源代码堆栈（已解析） */}
                        {event.parsedStack && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                    <span>源代码堆栈</span>
                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        已映射到源代码
                                    </Badge>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-96">
                                    {event.parsedStack}
                                </div>
                            </div>
                        )}

                        {/* 原始堆栈（压缩代码） - 展开显示 */}
                        {event.parsedStack && event.originalStack && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2">原始堆栈（压缩代码）</div>
                                <div className="p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-96">
                                    {event.originalStack}
                                </div>
                            </div>
                        )}

                        {/* 错误堆栈（未解析） */}
                        {!event.parsedStack && event.error_stack && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2">错误堆栈</div>
                                <div className="p-3 bg-muted rounded-md font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-96">
                                    {event.error_stack}
                                </div>
                            </div>
                        )}

                        {/* Session Replay 链接 */}
                        {event.replayId && event.session_id && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2">Session Replay</div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link to={`/sessions/${event.session_id}?replayId=${event.replayId}`}>
                                        查看 Session Replay
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* 关联错误列表 */}
            {event.relatedErrors && event.relatedErrors.length > 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>关联错误 ({event.relatedErrors.length} 个错误共用同一个 Replay)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {event.relatedErrors.map((relatedError, index) => {
                                const isCurrent = relatedError.id === event.id

                                // 错误类型 Badge 颜色
                                const getErrorTypeBadge = (errorType: string) => {
                                    const config: Record<
                                        string,
                                        { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }
                                    > = {
                                        error: { label: 'JS 错误', variant: 'destructive' },
                                        httpError: { label: 'HTTP 错误', variant: 'destructive' },
                                        resourceError: { label: '资源错误', variant: 'secondary' },
                                        unhandledrejection: { label: 'Promise 拒绝', variant: 'destructive' },
                                    }
                                    const { label, variant } = config[errorType] || {
                                        label: errorType,
                                        variant: 'outline' as const,
                                    }
                                    return (
                                        <Badge variant={variant} className="text-xs">
                                            {label}
                                        </Badge>
                                    )
                                }

                                return (
                                    <div
                                        key={relatedError.id}
                                        className={`p-3 rounded-md border ${isCurrent ? 'bg-primary/5 border-primary' : 'bg-muted/50'}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="text-sm font-medium">
                                                        {index + 1}. {relatedError.message}
                                                    </span>
                                                    {getErrorTypeBadge(relatedError.errorType)}
                                                    {isCurrent && (
                                                        <Badge variant="outline" className="text-xs">
                                                            当前
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    时间:{' '}
                                                    {format(new Date(relatedError.timestamp), 'yyyy-MM-dd HH:mm:ss', {
                                                        locale: zhCN,
                                                    })}
                                                </div>
                                            </div>
                                            {!isCurrent && (
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link to={`/events/${relatedError.id}`}>查看详情</Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
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

            {/* 用户操作历史（Breadcrumbs） */}
            {event.breadcrumbs && event.breadcrumbs.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>用户操作历史（Breadcrumbs）</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {event.breadcrumbs.map((breadcrumb, index) => (
                                <div key={index} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded transition-colors">
                                    {/* 时间 */}
                                    <span className="text-xs text-muted-foreground font-mono min-w-[60px]">
                                        {format(new Date(breadcrumb.timestamp), 'HH:mm:ss', { locale: zhCN })}
                                    </span>

                                    {/* 类别 Badge */}
                                    <Badge variant="outline" className="min-w-[60px] justify-center">
                                        {breadcrumb.category}
                                    </Badge>

                                    {/* 消息 */}
                                    <span className="text-sm flex-1">{breadcrumb.message}</span>

                                    {/* 错误标记 */}
                                    {breadcrumb.level === 'error' && (
                                        <Badge variant="destructive" className="text-xs">
                                            错误
                                        </Badge>
                                    )}
                                </div>
                            ))}
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
            {/* {event.event_data && (
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
            )} */}
        </div>
    )
}
