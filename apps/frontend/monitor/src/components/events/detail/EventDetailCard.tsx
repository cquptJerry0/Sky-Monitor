import type { Event } from '@/api/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { FieldRenderer } from './FieldRenderer'
import { RRWebPlayer } from '@/components/replay/RRWebPlayer'
import { BreadcrumbTimeline } from './BreadcrumbTimeline'
import { useReplayDetail } from '@/hooks/useReplayQuery'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { AlertCircle, Loader2, Info, Bug, Zap, User, Monitor, Network, Code, Tag, Database } from 'lucide-react'
import {
    commonFields,
    errorFields,
    httpErrorFields,
    performanceFields,
    resourceErrorFields,
    sessionFields,
    userFields,
    webVitalFields,
    deviceFields,
    networkFields,
    frameworkFields,
    metadataFields,
    type DetailField,
} from '../schemas/eventFieldSchema'

interface EventDetailCardProps {
    event: Event
}

export function EventDetailCard({ event }: EventDetailCardProps) {
    const { currentApp } = useCurrentApp()

    // 获取 Replay 数据
    const {
        data: replayDetail,
        isLoading: isLoadingReplay,
        error: replayError,
    } = useReplayDetail(event.replayId || null, currentApp?.id ? String(currentApp.id) : null)

    const getFieldValue = (field: DetailField, event: Event): unknown => {
        if (field.extract) {
            return field.extract(event)
        }
        const keys = field.key.split('.')
        // 使用 unknown 并逐步访问属性
        let value: unknown = event
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = (value as Record<string, unknown>)[key]
            } else {
                return undefined
            }
        }
        return value
    }

    const renderFields = (fields: DetailField[], title: string) => {
        const visibleFields = fields.filter(field => {
            if (field.condition && !field.condition(event)) return false
            const value = getFieldValue(field, event)
            return value !== null && value !== undefined && value !== ''
        })

        if (visibleFields.length === 0) return null

        return (
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">{title}</h3>
                <div className="space-y-3">
                    {visibleFields.map(field => {
                        const value = getFieldValue(field, event)
                        return (
                            <div key={field.key} className="space-y-1">
                                <div className="text-xs font-medium text-muted-foreground">{field.label}</div>
                                <FieldRenderer type={field.type} value={value} />
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // 判断是否有上下文数据
    const hasContextData =
        (event.breadcrumbs && event.breadcrumbs.length > 0) ||
        (event.contexts && Object.keys(event.contexts).length > 0) ||
        (event.tags && Object.keys(event.tags).length > 0) ||
        (event.extra && Object.keys(event.extra).length > 0)

    // 判断是否有环境数据
    const hasEnvironmentData =
        event.device || (event.network && (event.network.type || event.network.rtt)) || event.framework || event.user_id || event.session_id

    return (
        <div className="space-y-6">
            {/* Session Replay 播放器 - 置顶显示 */}
            {event.replayId && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="h-5 w-5" />
                            会话回放
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingReplay && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-muted-foreground">加载回放数据...</span>
                            </div>
                        )}
                        {replayError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>加载回放失败: {replayError.message}</AlertDescription>
                            </Alert>
                        )}
                        {replayDetail && !isLoadingReplay && (
                            <RRWebPlayer
                                events={replayDetail.events}
                                relatedErrors={replayDetail.relatedErrors}
                                autoPlay={false}
                                showController={true}
                            />
                        )}
                    </CardContent>
                </Card>
            )}

            {/* 主要内容 - 使用 Tabs 组织 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        事件详情
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">概览</TabsTrigger>
                            <TabsTrigger value="context" disabled={!hasContextData}>
                                上下文
                            </TabsTrigger>
                            <TabsTrigger value="environment" disabled={!hasEnvironmentData}>
                                环境
                            </TabsTrigger>
                            <TabsTrigger value="metadata">元数据</TabsTrigger>
                        </TabsList>

                        {/* 概览 Tab */}
                        <TabsContent value="overview" className="space-y-6 mt-6">
                            {renderFields(commonFields, '基本信息')}

                            {(event.event_type === 'error' || event.event_type === 'unhandledrejection') && (
                                <>
                                    <Separator />
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold flex items-center gap-2">
                                            <Bug className="h-4 w-4" />
                                            错误详情
                                        </h3>
                                        {event.http && renderFields(httpErrorFields, '')}
                                        {event.resource && renderFields(resourceErrorFields, '')}
                                        {!event.http && !event.resource && renderFields(errorFields, '')}
                                    </div>
                                </>
                            )}

                            {event.event_type === 'performance' && (
                                <>
                                    <Separator />
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold flex items-center gap-2">
                                            <Zap className="h-4 w-4" />
                                            性能详情
                                        </h3>
                                        {renderFields(performanceFields, '')}
                                    </div>
                                </>
                            )}

                            {event.event_type === 'webVital' && (
                                <>
                                    <Separator />
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold flex items-center gap-2">
                                            <Zap className="h-4 w-4" />
                                            Web Vitals 详情
                                        </h3>
                                        {renderFields(webVitalFields, '')}
                                    </div>
                                </>
                            )}
                        </TabsContent>

                        {/* 上下文 Tab */}
                        <TabsContent value="context" className="space-y-6 mt-6">
                            {event.breadcrumbs && event.breadcrumbs.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">用户行为轨迹</h3>
                                    <BreadcrumbTimeline breadcrumbs={event.breadcrumbs} />
                                </div>
                            )}

                            {event.tags && Object.keys(event.tags).length > 0 && (
                                <>
                                    {event.breadcrumbs && event.breadcrumbs.length > 0 && <Separator />}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold flex items-center gap-2">
                                            <Tag className="h-4 w-4" />
                                            标签
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(event.tags).map(([key, value]) => (
                                                <Badge key={key} variant="secondary">
                                                    {key}: {String(value)}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {event.contexts && Object.keys(event.contexts).length > 0 && (
                                <>
                                    <Separator />
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold flex items-center gap-2">
                                            <Code className="h-4 w-4" />
                                            上下文
                                        </h3>
                                        <FieldRenderer type="json" value={event.contexts} />
                                    </div>
                                </>
                            )}

                            {event.extra && Object.keys(event.extra).length > 0 && (
                                <>
                                    <Separator />
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold flex items-center gap-2">
                                            <Database className="h-4 w-4" />
                                            额外信息
                                        </h3>
                                        <FieldRenderer type="json" value={event.extra} />
                                    </div>
                                </>
                            )}
                        </TabsContent>

                        {/* 环境 Tab */}
                        <TabsContent value="environment" className="space-y-6 mt-6">
                            {event.user_id && (
                                <>
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            用户信息
                                        </h3>
                                        {renderFields(userFields, '')}
                                    </div>
                                    <Separator />
                                </>
                            )}

                            {event.session_id && (
                                <>
                                    {renderFields(sessionFields, '会话信息')}
                                    <Separator />
                                </>
                            )}

                            {event.device && (
                                <>
                                    {renderFields(deviceFields, '设备信息')}
                                    <Separator />
                                </>
                            )}

                            {event.network && (event.network.type || event.network.rtt) && (
                                <>
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold flex items-center gap-2">
                                            <Network className="h-4 w-4" />
                                            网络信息
                                        </h3>
                                        {renderFields(networkFields, '')}
                                    </div>
                                    <Separator />
                                </>
                            )}

                            {event.framework && renderFields(frameworkFields, '框架信息')}
                        </TabsContent>

                        {/* 元数据 Tab */}
                        <TabsContent value="metadata" className="space-y-6 mt-6">
                            {renderFields(metadataFields, '元数据')}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
