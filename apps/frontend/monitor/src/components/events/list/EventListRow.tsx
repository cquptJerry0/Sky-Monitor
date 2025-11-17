import type { Event } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { TableCell, TableRow } from '@/components/ui/table'
import { TruncatedText } from '@/components/ui/truncated-text'
import { formatEventTime, getEventTypeBadgeVariant } from '@/utils/eventUtils'
import { Video } from 'lucide-react'
import { extractEventMessage } from '../schemas/eventDisplaySchema'

interface EventListRowProps {
    event: Event
    onClick: (event: Event) => void
}

export function EventListRow({ event, onClick }: EventListRowProps) {
    const message = extractEventMessage(event)

    return (
        <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => onClick(event)}>
            <TableCell className="font-mono text-xs">{formatEventTime(event.timestamp)}</TableCell>
            <TableCell>
                <Badge variant={getEventTypeBadgeVariant(event.event_type)}>{event.event_type}</Badge>
            </TableCell>
            <TableCell>
                <div className="space-y-1">
                    <TruncatedText text={message.primary} maxWidth="max-w-md" className="text-sm font-medium" />
                    {message.secondary && (
                        <TruncatedText text={message.secondary} maxWidth="max-w-md" className="text-xs text-muted-foreground" />
                    )}
                </div>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
                <TruncatedText text={event.user_id || event.user_email || ''} maxWidth="max-w-[120px]" />
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
                <TruncatedText text={event.session_id || ''} maxWidth="max-w-[100px]" />
            </TableCell>
        </TableRow>
    )
}
