import type { BadgeProps } from '@/components/ui/badge'

export function getEventTypeBadgeVariant(eventType: string): BadgeProps['variant'] {
    switch (eventType) {
        case 'error':
        case 'unhandledrejection':
            return 'destructive'
        case 'performance':
        case 'webVital':
            return 'default'
        case 'session':
            return 'secondary'
        default:
            return 'outline'
    }
}

export function getEventTypeBadgeColor(eventType: string): string {
    switch (eventType) {
        case 'error':
        case 'unhandledrejection':
            return 'bg-red-500 text-white border-red-600'
        case 'performance':
            return 'bg-blue-500 text-white border-blue-600'
        case 'webVital':
            return 'bg-purple-500 text-white border-purple-600'
        case 'session':
            return 'bg-green-500 text-white border-green-600'
        default:
            return 'bg-gray-500 text-white border-gray-600'
    }
}

export function getHttpStatusBadgeColor(status: number): string {
    if (status >= 200 && status < 300) {
        return 'bg-green-500 text-white border-green-600'
    } else if (status >= 300 && status < 400) {
        return 'bg-blue-500 text-white border-blue-600'
    } else if (status >= 400 && status < 500) {
        return 'bg-orange-500 text-white border-orange-600'
    } else if (status >= 500) {
        return 'bg-red-500 text-white border-red-600'
    }
    return 'bg-gray-500 text-white border-gray-600'
}

export function getHttpMethodBadgeColor(method: string): string {
    switch (method.toUpperCase()) {
        case 'GET':
            return 'bg-blue-500 text-white border-blue-600'
        case 'POST':
            return 'bg-green-500 text-white border-green-600'
        case 'PUT':
            return 'bg-yellow-500 text-white border-yellow-600'
        case 'DELETE':
            return 'bg-red-500 text-white border-red-600'
        case 'PATCH':
            return 'bg-purple-500 text-white border-purple-600'
        default:
            return 'bg-gray-500 text-white border-gray-600'
    }
}

export function getEventLevelBadgeColor(level: string): string {
    switch (level.toLowerCase()) {
        case 'fatal':
        case 'error':
            return 'bg-red-500 text-white border-red-600'
        case 'warning':
        case 'warn':
            return 'bg-yellow-500 text-white border-yellow-600'
        case 'info':
            return 'bg-blue-500 text-white border-blue-600'
        case 'debug':
            return 'bg-gray-500 text-white border-gray-600'
        default:
            return 'bg-gray-500 text-white border-gray-600'
    }
}

export function getEnvironmentBadgeColor(env: string): string {
    switch (env.toLowerCase()) {
        case 'production':
        case 'prod':
            return 'bg-red-500 text-white border-red-600'
        case 'staging':
        case 'stage':
            return 'bg-yellow-500 text-white border-yellow-600'
        case 'development':
        case 'dev':
            return 'bg-green-500 text-white border-green-600'
        case 'test':
            return 'bg-blue-500 text-white border-blue-600'
        default:
            return 'bg-gray-500 text-white border-gray-600'
    }
}

export function getResourceTypeBadgeColor(type: string): string {
    switch (type.toLowerCase()) {
        case 'script':
        case 'js':
            return 'bg-yellow-500 text-white border-yellow-600'
        case 'stylesheet':
        case 'css':
            return 'bg-blue-500 text-white border-blue-600'
        case 'image':
        case 'img':
            return 'bg-green-500 text-white border-green-600'
        case 'font':
            return 'bg-purple-500 text-white border-purple-600'
        default:
            return 'bg-gray-500 text-white border-gray-600'
    }
}

export function getWebVitalRatingBadgeColor(rating: string): string {
    switch (rating.toLowerCase()) {
        case 'good':
            return 'bg-green-500 text-white border-green-600'
        case 'needs-improvement':
            return 'bg-yellow-500 text-white border-yellow-600'
        case 'poor':
            return 'bg-red-500 text-white border-red-600'
        default:
            return 'bg-gray-500 text-white border-gray-600'
    }
}

export function getDeviceTypeBadgeColor(type: string): string {
    switch (type.toLowerCase()) {
        case 'desktop':
            return 'bg-blue-500 text-white border-blue-600'
        case 'mobile':
            return 'bg-green-500 text-white border-green-600'
        case 'tablet':
            return 'bg-purple-500 text-white border-purple-600'
        default:
            return 'bg-gray-500 text-white border-gray-600'
    }
}

export function getSourceMapStatusBadgeColor(status: string): string {
    switch (status.toLowerCase()) {
        case 'parsed':
        case 'success':
            return 'bg-green-500 text-white border-green-600'
        case 'failed':
        case 'error':
            return 'bg-red-500 text-white border-red-600'
        case 'not_found':
            return 'bg-yellow-500 text-white border-yellow-600'
        default:
            return 'bg-gray-500 text-white border-gray-600'
    }
}
