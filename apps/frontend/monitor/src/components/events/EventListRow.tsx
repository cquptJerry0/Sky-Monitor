import type { Event } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { TableCell, TableRow } from '@/components/ui/table'
import { formatEventTime, getEventTypeBadgeVariant } from '@/utils/eventUtils'
import { extractEventMessage } from './eventMessageExtractor'

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
                    <div className="text-sm font-medium">{message.primary}</div>
                    {message.secondary && <div className="text-xs text-muted-foreground">{message.secondary}</div>}
                </div>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{event.path || '-'}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{event.user_id || event.user_email || '-'}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{event.session_id ? event.session_id.slice(0, 8) : '-'}</TableCell>
        </TableRow>
    )
}
