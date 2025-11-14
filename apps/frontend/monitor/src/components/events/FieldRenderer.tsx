import { Badge } from '@/components/ui/badge'
import { formatDuration, formatEventTime } from '@/utils/eventUtils'
import type { FieldType } from './eventFieldSchema'

interface FieldRendererProps {
    type: FieldType
    value: unknown
}

export function FieldRenderer({ type, value }: FieldRendererProps) {
    if (value === null || value === undefined || value === '') {
        return <span className="text-muted-foreground">-</span>
    }

    switch (type) {
        case 'text':
            return <span className="text-sm">{String(value)}</span>

        case 'number':
            return <span className="text-sm font-mono">{String(value)}</span>

        case 'code':
            return (
                <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
                    <code>{String(value)}</code>
                </pre>
            )

        case 'json':
            return (
                <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
                    <code>{JSON.stringify(value, null, 2)}</code>
                </pre>
            )

        case 'link':
            return (
                <a
                    href={String(value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                >
                    {String(value)}
                </a>
            )

        case 'duration':
            return <span className="text-sm font-mono">{formatDuration(Number(value))}</span>

        case 'timestamp':
            if (typeof value === 'number') {
                return <span className="text-sm font-mono">{formatEventTime(new Date(value).toISOString())}</span>
            }
            return <span className="text-sm font-mono">{formatEventTime(String(value))}</span>

        case 'badge':
            return (
                <Badge variant="outline" className="font-mono">
                    {String(value)}
                </Badge>
            )

        default:
            return <span className="text-sm">{String(value)}</span>
    }
}
