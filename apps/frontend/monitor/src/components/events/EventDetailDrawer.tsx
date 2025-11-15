import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useEventDetail } from '@/hooks/useEventQuery'
import { X } from 'lucide-react'
import { EventDetailCard } from './EventDetailCard'
import { extractEventMessage } from './eventDisplaySchema'

interface EventDetailDrawerProps {
    eventId: string | null
    appId: string
    open: boolean
    onClose: () => void
}

export function EventDetailDrawer({ eventId, appId, open, onClose }: EventDetailDrawerProps) {
    const { data: event, isLoading } = useEventDetail(eventId, appId, open)

    if (!eventId) return null

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
                <SheetHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            {isLoading ? (
                                <>
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="mt-2 h-4 w-1/2" />
                                </>
                            ) : event ? (
                                <>
                                    <SheetTitle>{extractEventMessage(event).primary}</SheetTitle>
                                    {extractEventMessage(event).secondary && (
                                        <SheetDescription className="mt-1">{extractEventMessage(event).secondary}</SheetDescription>
                                    )}
                                </>
                            ) : (
                                <SheetTitle>事件详情</SheetTitle>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </SheetHeader>
                <div className="mt-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    ) : event ? (
                        <EventDetailCard event={event} />
                    ) : (
                        <div className="py-12 text-center text-muted-foreground">加载失败</div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
