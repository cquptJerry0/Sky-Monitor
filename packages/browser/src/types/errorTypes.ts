import type { ErrorEvent } from '@sky-monitor/monitor-sdk-core'

/**
 * 设备信息
 */
export interface DeviceInfo {
    browser: string
    browserVersion: string
    os: string
    osVersion: string
    deviceType: 'mobile' | 'tablet' | 'desktop'
    screenResolution: string
    language: string
    timezone: string
}

/**
 * 网络信息
 */
export interface NetworkInfo {
    effectiveType?: string // 4g, 3g, 2g, slow-2g
    downlink?: number // Mbps
    rtt?: number // ms
    saveData?: boolean
}

/**
 * 错误指纹
 */
export interface ErrorFingerprint {
    hash: string
    algorithm: 'stacktrace' | 'message' | 'custom'
}

/**
 * HTTP 错误详情
 */
export interface HttpErrorDetails {
    url: string
    method: string
    status: number
    statusText: string
    requestHeaders?: Record<string, string>
    responseHeaders?: Record<string, string>
    requestBody?: any
    responseBody?: any
    duration: number
}

/**
 * 资源错误详情
 */
export interface ResourceErrorDetails {
    url: string
    tagName: string
    resourceType: 'script' | 'img' | 'link' | 'video' | 'audio' | 'unknown'
    outerHTML?: string
}

/**
 * 浏览器错误事件（扩展 ErrorEvent）
 */
export interface BrowserErrorEvent extends ErrorEvent {
    lineno?: number
    colno?: number
    errorFingerprint?: ErrorFingerprint
    device?: DeviceInfo
    network?: NetworkInfo
    httpError?: HttpErrorDetails
    resourceError?: ResourceErrorDetails
}
