import { Badge } from '@/components/ui/badge'
import { TruncatedText } from '@/components/ui/truncated-text'
import { formatDuration, formatEventTime } from '@/utils/eventUtils'
import {
    getHttpStatusBadgeColor,
    getHttpMethodBadgeColor,
    getEventTypeBadgeColor,
    getEventLevelBadgeColor,
    getEnvironmentBadgeColor,
    getResourceTypeBadgeColor,
    getWebVitalRatingBadgeColor,
    getDeviceTypeBadgeColor,
    getSourceMapStatusBadgeColor,
} from '@/utils/badgeUtils'
import type { FieldType } from '../schemas/eventFieldSchema'

interface FieldRendererProps {
    type: FieldType
    value: unknown
    fieldKey?: string
}

export function FieldRenderer({ type, value, fieldKey }: FieldRendererProps) {
    if (value === null || value === undefined || value === '') {
        return <span className="text-muted-foreground">-</span>
    }

    const getBadgeColorClass = (key: string | undefined, val: unknown): string => {
        const strValue = String(val)
        if (!key) return ''

        if (key.includes('status') && !isNaN(Number(strValue))) {
            return getHttpStatusBadgeColor(Number(strValue))
        }
        if (key.includes('method')) {
            return getHttpMethodBadgeColor(strValue)
        }
        if (key === 'event_type') {
            return getEventTypeBadgeColor(strValue)
        }
        if (key === 'event_level') {
            return getEventLevelBadgeColor(strValue)
        }
        if (key === 'environment') {
            return getEnvironmentBadgeColor(strValue)
        }
        if (key.includes('type') && key.includes('resource')) {
            return getResourceTypeBadgeColor(strValue)
        }
        if (key === 'rating') {
            return getWebVitalRatingBadgeColor(strValue)
        }
        if (key.includes('type') && key.includes('device')) {
            return getDeviceTypeBadgeColor(strValue)
        }
        if (key === 'sourceMapStatus') {
            return getSourceMapStatusBadgeColor(strValue)
        }
        return ''
    }

    switch (type) {
        case 'text':
            return <TruncatedText text={String(value)} maxWidth="max-w-2xl" className="text-sm text-left" />

        case 'number':
            return <div className="text-sm font-mono text-left">{String(value)}</div>

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
                    className="text-sm text-primary underline-offset-4 hover:underline truncate block max-w-2xl text-left"
                    title={String(value)}
                >
                    {String(value)}
                </a>
            )

        case 'duration':
            return <div className="text-sm font-mono text-left">{formatDuration(Number(value))}</div>

        case 'timestamp':
            if (typeof value === 'number') {
                return <div className="text-sm font-mono text-left">{formatEventTime(new Date(value).toISOString())}</div>
            }
            return <div className="text-sm font-mono text-left">{formatEventTime(String(value))}</div>

        case 'badge': {
            const colorClass = getBadgeColorClass(fieldKey, value)
            return (
                <div className="text-left">
                    <Badge variant="outline" className={`font-mono ${colorClass}`}>
                        {String(value)}
                    </Badge>
                </div>
            )
        }

        default:
            return <TruncatedText text={String(value)} maxWidth="max-w-2xl" className="text-sm text-left" />
    }
}
