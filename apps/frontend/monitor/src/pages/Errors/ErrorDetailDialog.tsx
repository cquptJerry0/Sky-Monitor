import { format } from 'date-fns'
import { Monitor, Network, Users, Clock, Hash, AlertCircle } from 'lucide-react'

import { ErrorStack } from '@/components/ErrorStack'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ErrorEvent } from '@/types/api'

interface ErrorDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    error: ErrorEvent
}

export function ErrorDetailDialog({ open, onOpenChange, error }: ErrorDetailDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        错误详情
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">概览</TabsTrigger>
                        <TabsTrigger value="stack">堆栈</TabsTrigger>
                        <TabsTrigger value="device">设备信息</TabsTrigger>
                        <TabsTrigger value="breadcrumbs">面包屑</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">基本信息</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">错误级别</p>
                                        <Badge variant={error.level === 'error' ? 'destructive' : 'default'}>{error.level}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">发生时间</p>
                                        <p className="text-sm font-mono">{format(new Date(error.timestamp), 'yyyy-MM-dd HH:mm:ss')}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        错误消息
                                    </p>
                                    <p className="text-sm font-medium break-words">{error.message}</p>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                        <Hash className="h-3 w-3" />
                                        错误指纹
                                    </p>
                                    <p className="text-xs font-mono bg-muted p-2 rounded break-all">{error.fingerprint}</p>
                                </div>

                                {error.session_id && (
                                    <>
                                        <Separator />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">会话 ID</p>
                                                <p className="text-xs font-mono">{error.session_id}</p>
                                            </div>
                                            {error.user_id && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">用户 ID</p>
                                                    <p className="text-xs font-mono">{error.user_id}</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="stack">
                        <ErrorStack stack={error.stack} parsedStack={error.parsedStack} />
                    </TabsContent>

                    <TabsContent value="device" className="space-y-4">
                        {error.deviceInfo && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Monitor className="h-4 w-4" />
                                        设备信息
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">浏览器</p>
                                        <p className="text-sm">{error.deviceInfo.browser || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">操作系统</p>
                                        <p className="text-sm">{error.deviceInfo.os || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">设备类型</p>
                                        <p className="text-sm">{error.deviceInfo.device || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">屏幕分辨率</p>
                                        <p className="text-sm">{error.deviceInfo.screen || '-'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {error.networkInfo && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Network className="h-4 w-4" />
                                        网络信息
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">网络类型</p>
                                        <p className="text-sm">{error.networkInfo.type || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">RTT (往返时间)</p>
                                        <p className="text-sm">{error.networkInfo.rtt ? `${error.networkInfo.rtt}ms` : '-'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="breadcrumbs">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    用户行为轨迹
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {error.breadcrumbs && error.breadcrumbs.length > 0 ? (
                                    <div className="space-y-2">
                                        {error.breadcrumbs.map((breadcrumb, index) => (
                                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                                <div className="flex flex-col items-center">
                                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                                    {index < error.breadcrumbs!.length - 1 && (
                                                        <div className="w-px h-full bg-border mt-1" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {breadcrumb.type}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {format(new Date(breadcrumb.timestamp), 'HH:mm:ss')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{breadcrumb.message}</p>
                                                    {breadcrumb.data && (
                                                        <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                                                            {JSON.stringify(breadcrumb.data, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">暂无面包屑数据</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
