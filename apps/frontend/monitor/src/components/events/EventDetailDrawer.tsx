import type { Event } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { X } from 'lucide-react'
import { EventDetailCard } from './EventDetailCard'
import { extractEventMessage } from './eventMessageExtractor'

interface EventDetailDrawerProps {
    event: Event | null
    open: boolean
    onClose: () => void
}

export function EventDetailDrawer({ event, open, onClose }: EventDetailDrawerProps) {
    if (!event) return null

    const message = extractEventMessage(event)

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
                <SheetHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <SheetTitle>{message.primary}</SheetTitle>
                            {message.secondary && <SheetDescription className="mt-1">{message.secondary}</SheetDescription>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </SheetHeader>
                <div className="mt-6">
                    <EventDetailCard event={event} />
                </div>
            </SheetContent>
        </Sheet>
    )
}
