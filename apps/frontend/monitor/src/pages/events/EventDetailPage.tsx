import { useParams, useNavigate } from 'react-router-dom'
import { useCurrentApp } from '@/hooks/useCurrentApp'
import { useEventDetail } from '@/hooks/useEventQuery'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EventDetailCard } from '@/components/events'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { ROUTES } from '@/utils/constants'

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { currentApp } = useCurrentApp()

    const { data: event, isLoading, error } = useEventDetail(id || null)

    const handleBack = () => {
        navigate(ROUTES.EVENTS)
    }

    if (!id) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={handleBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        返回列表
                    </Button>
                </div>
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">事件 ID 不存在</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    返回列表
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">事件详情</h1>
                    <p className="mt-1 text-sm text-muted-foreground">事件 ID: {id}</p>
                </div>
            </div>

            {isLoading ? (
                <Card>
                    <CardContent className="space-y-6 py-6">
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : error ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                        <p className="mt-4 text-muted-foreground">加载事件详情失败</p>
                        <p className="mt-2 text-sm text-muted-foreground">{error instanceof Error ? error.message : '未知错误'}</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={handleBack}>
                            返回列表
                        </Button>
                    </CardContent>
                </Card>
            ) : event ? (
                <EventDetailCard event={event} />
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">事件不存在</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={handleBack}>
                            返回列表
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
