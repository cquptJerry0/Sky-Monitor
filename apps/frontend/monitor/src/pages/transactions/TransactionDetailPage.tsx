/**
 * Transaction 详情页
 * 展示 Transaction 的详细信息和 Span 树形图
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useEventDetail } from '@/hooks/useEventQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Span {
    spanId: string
    parentSpanId?: string
    op: string
    description?: string
    startTimestamp: number
    endTimestamp: number
}

interface SpanNode extends Span {
    children: SpanNode[]
}

export default function TransactionDetailPage() {
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
                <div className="text-muted-foreground">Transaction 不存在</div>
            </div>
        )
    }

    const eventData = typeof event.event_data === 'string' ? JSON.parse(event.event_data) : event.event_data
    const status = eventData?.status || 'unknown'
    const op = eventData?.op || 'unknown'
    const spans: Span[] = eventData?.spans || []
    const startTimestamp = eventData?.startTimestamp
    const endTimestamp = eventData?.endTimestamp
    const duration = startTimestamp && endTimestamp ? ((endTimestamp - startTimestamp) / 1000).toFixed(2) : 'N/A'

    // 获取状态图标
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ok':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'error':
                return <XCircle className="h-5 w-5 text-red-500" />
            case 'cancelled':
                return <AlertCircle className="h-5 w-5 text-yellow-500" />
            default:
                return <Clock className="h-5 w-5 text-gray-500" />
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

    // 构建 Span 树
    const buildSpanTree = (spans: Span[]): SpanNode[] => {
        const spanMap = new Map<string, SpanNode>()
        const rootSpans: SpanNode[] = []

        // 初始化所有 span
        spans.forEach(span => {
            spanMap.set(span.spanId, { ...span, children: [] })
        })

        // 构建树形结构
        spans.forEach(span => {
            const spanNode = spanMap.get(span.spanId)!
            if (span.parentSpanId) {
                const parent = spanMap.get(span.parentSpanId)
                if (parent) {
                    parent.children.push(spanNode)
                } else {
                    rootSpans.push(spanNode)
                }
            } else {
                rootSpans.push(spanNode)
            }
        })

        return rootSpans
    }

    // 渲染 Span 树节点
    const renderSpanNode = (span: SpanNode, level: number = 0, totalDuration: number): JSX.Element => {
        const spanDuration = ((span.endTimestamp - span.startTimestamp) / 1000).toFixed(2)
        const percentage = totalDuration > 0 ? ((span.endTimestamp - span.startTimestamp) / totalDuration) * 100 : 0

        return (
            <div key={span.spanId} className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card" style={{ marginLeft: `${level * 24}px` }}>
                    <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{span.description || span.op}</span>
                            <Badge variant="outline" className="text-xs">
                                {span.op}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {spanDuration}s
                            </span>
                            <span>{percentage.toFixed(1)}%</span>
                            <span className="text-xs truncate">ID: {span.spanId.slice(0, 8)}...</span>
                        </div>
                        {/* 进度条 */}
                        <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${Math.min(percentage, 100)}%` }} />
                        </div>
                    </div>
                </div>
                {span.children.length > 0 && (
                    <div className="space-y-2">{span.children.map(child => renderSpanNode(child, level + 1, totalDuration))}</div>
                )}
            </div>
        )
    }

    const spanTree = buildSpanTree(spans)
    const totalDuration = endTimestamp && startTimestamp ? endTimestamp - startTimestamp : 0

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Transaction 详情</h1>
                    <p className="text-muted-foreground mt-1">{event.event_name || '未命名 Transaction'}</p>
                </div>
            </div>

            {/* Transaction 基本信息 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        基本信息
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-sm text-muted-foreground">Transaction 名称</div>
                            <div className="font-medium mt-1">{event.event_name || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">操作类型</div>
                            <div className="font-medium mt-1">
                                <Badge variant="outline">{op}</Badge>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">状态</div>
                            <div className="font-medium mt-1">
                                <Badge variant={getStatusColor(status) as any}>{status}</Badge>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">总耗时</div>
                            <div className="font-medium mt-1">{duration}s</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Span 数量</div>
                            <div className="font-medium mt-1">{spans.length}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">时间</div>
                            <div className="font-medium mt-1">
                                {formatDistanceToNow(new Date(event.timestamp), {
                                    addSuffix: true,
                                    locale: zhCN,
                                })}
                            </div>
                        </div>
                        {event.user_id && (
                            <div>
                                <div className="text-sm text-muted-foreground">用户 ID</div>
                                <div className="font-medium mt-1">{event.user_id}</div>
                            </div>
                        )}
                        {event.session_id && (
                            <div>
                                <div className="text-sm text-muted-foreground">会话 ID</div>
                                <div
                                    className="font-medium mt-1 text-primary cursor-pointer hover:underline"
                                    onClick={() => navigate(`/sessions/${event.session_id}`)}
                                >
                                    {event.session_id.slice(0, 8)}...
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Span 树形图 */}
            <Card>
                <CardHeader>
                    <CardTitle>Span 追踪树</CardTitle>
                </CardHeader>
                <CardContent>
                    {spans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                            <div className="text-muted-foreground">此 Transaction 没有 Span 数据</div>
                        </div>
                    ) : (
                        <div className="space-y-3">{spanTree.map(span => renderSpanNode(span, 0, totalDuration))}</div>
                    )}
                </CardContent>
            </Card>

            {/* 时间线可视化 */}
            {spans.length > 0 && startTimestamp && endTimestamp && (
                <Card>
                    <CardHeader>
                        <CardTitle>时间线可视化</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {spans.map(span => {
                                const spanStart = span.startTimestamp - startTimestamp
                                const spanDuration = span.endTimestamp - span.startTimestamp
                                const leftPercent = (spanStart / totalDuration) * 100
                                const widthPercent = (spanDuration / totalDuration) * 100

                                return (
                                    <div key={span.spanId} className="flex items-center gap-3">
                                        <div className="w-32 text-sm text-muted-foreground truncate">{span.description || span.op}</div>
                                        <div className="flex-1 h-8 bg-secondary rounded relative">
                                            <div
                                                className="absolute h-full bg-primary rounded flex items-center justify-center text-xs text-primary-foreground"
                                                style={{
                                                    left: `${leftPercent}%`,
                                                    width: `${widthPercent}%`,
                                                }}
                                            >
                                                {(spanDuration / 1000).toFixed(2)}s
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
