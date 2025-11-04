import { DeviceInfo, NetworkInfo } from '../types/errorTypes'

/**
 * 解析 User-Agent 获取浏览器信息
 */
function parseBrowserInfo(ua: string): { browser: string; browserVersion: string } {
    const browsers = [
        { name: 'Chrome', regex: /Chrome\/(\d+\.\d+)/ },
        { name: 'Firefox', regex: /Firefox\/(\d+\.\d+)/ },
        { name: 'Safari', regex: /Version\/(\d+\.\d+).*Safari/ },
        { name: 'Edge', regex: /Edg\/(\d+\.\d+)/ },
        { name: 'Opera', regex: /OPR\/(\d+\.\d+)/ },
        { name: 'IE', regex: /MSIE (\d+\.\d+)|Trident.*rv:(\d+\.\d+)/ },
    ]

    for (const { name, regex } of browsers) {
        const match = ua.match(regex)
        if (match) {
            return {
                browser: name,
                browserVersion: match[1] || match[2] || 'unknown',
            }
        }
    }

    return { browser: 'Unknown', browserVersion: 'unknown' }
}

/**
 * 解析 User-Agent 获取操作系统信息
 */
function parseOSInfo(ua: string): { os: string; osVersion: string } {
    const osList = [
        { name: 'Windows', regex: /Windows NT (\d+\.\d+)/ },
        { name: 'macOS', regex: /Mac OS X (\d+[._]\d+)/ },
        { name: 'iOS', regex: /iPhone OS (\d+[._]\d+)|iPad.*OS (\d+[._]\d+)/ },
        { name: 'Android', regex: /Android (\d+\.\d+)/ },
        { name: 'Linux', regex: /Linux/ },
    ]

    for (const { name, regex } of osList) {
        const match = ua.match(regex)
        if (match) {
            const version = (match[1] || match[2] || '').replace(/_/g, '.')
            return { os: name, osVersion: version || 'unknown' }
        }
    }

    return { os: 'Unknown', osVersion: 'unknown' }
}

/**
 * 判断设备类型
 */
function getDeviceType(ua: string): 'mobile' | 'tablet' | 'desktop' {
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet'
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'mobile'
    }
    return 'desktop'
}

/**
 * 收集设备信息
 */
export function collectDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent
    const { browser, browserVersion } = parseBrowserInfo(ua)
    const { os, osVersion } = parseOSInfo(ua)

    return {
        browser,
        browserVersion,
        os,
        osVersion,
        deviceType: getDeviceType(ua),
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
}

/**
 * 收集网络信息
 */
export function collectNetworkInfo(): NetworkInfo | undefined {
    // @ts-expect-error - navigator.connection 不是所有浏览器都支持
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

    if (!connection) {
        return undefined
    }

    return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
    }
}
