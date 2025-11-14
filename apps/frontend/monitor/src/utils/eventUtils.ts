import type { Event, EventType } from '@/api/types'

export function parseEventData(event: Event): Record<string, unknown> {
    if (!event.event_data) return {}
    if (typeof event.event_data === 'string') {
        try {
            return JSON.parse(event.event_data)
        } catch {
            return {}
        }
    }
    return event.event_data
}

export function getWebVitalUnit(name: string): string {
    const units: Record<string, string> = {
        CLS: '',
        FCP: 'ms',
        FID: 'ms',
        INP: 'ms',
        LCP: 'ms',
        TTFB: 'ms',
    }
    return units[name] || ''
}

export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
    return `${(ms / 60000).toFixed(2)}min`
}

export function getEventTypeColor(type: EventType): string {
    const colors: Record<EventType, string> = {
        error: 'var(--event-error)',
        unhandledrejection: 'var(--event-error)',
        httpError: 'var(--event-error)',
        resourceError: 'var(--event-error)',
        performance: 'var(--event-performance)',
        webVital: 'var(--event-webvital-good)',
        message: 'var(--event-message)',
        session: 'var(--event-session)',
        event: 'var(--event-custom)',
        custom: 'var(--event-custom)',
    }
    return colors[type] || 'var(--muted)'
}

export function getWebVitalRatingColor(rating?: string): string {
    if (!rating) return 'var(--event-webvital-good)'
    const colors: Record<string, string> = {
        good: 'var(--event-webvital-good)',
        'needs-improvement': 'var(--event-webvital-needs-improvement)',
        poor: 'var(--event-webvital-poor)',
    }
    return colors[rating] || 'var(--event-webvital-good)'
}

export function formatEventTime(timestamp: string): string {
    const date = new Date(timestamp)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function parseJsonSafe<T = unknown>(value: string | null | undefined): T | null {
    if (!value) return null
    try {
        return JSON.parse(value) as T
    } catch {
        return null
    }
}

export function getEventTypeBadgeVariant(type: EventType): 'default' | 'destructive' | 'outline' | 'secondary' {
    if (type === 'error' || type === 'unhandledrejection') {
        return 'destructive'
    }
    if (type === 'performance' || type === 'webVital') {
        return 'default'
    }
    return 'secondary'
}
