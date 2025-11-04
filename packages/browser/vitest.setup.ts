/**
 * Vitest 全局设置文件
 * 用于配置浏览器环境的全局变量和模拟
 */

// 模拟浏览器全局对象
if (typeof window !== 'undefined') {
    // 模拟 navigator
    Object.defineProperty(window, 'navigator', {
        value: {
            userAgent:
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            language: 'en-US',
            onLine: true,
        },
        writable: true,
    })

    // 模拟 screen
    Object.defineProperty(window, 'screen', {
        value: {
            width: 1920,
            height: 1080,
        },
        writable: true,
    })

    // 模拟 performance
    if (!window.performance) {
        Object.defineProperty(window, 'performance', {
            value: {
                now: () => Date.now(),
                timing: {},
            },
            writable: true,
        })
    }

    // 模拟 localStorage
    if (!window.localStorage) {
        const storage: Record<string, string> = {}
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: (key: string) => storage[key] || null,
                setItem: (key: string, value: string) => {
                    storage[key] = value
                },
                removeItem: (key: string) => {
                    delete storage[key]
                },
                clear: () => {
                    Object.keys(storage).forEach(key => delete storage[key])
                },
            },
            writable: true,
        })
    }

    // 模拟 sessionStorage
    if (!window.sessionStorage) {
        const storage: Record<string, string> = {}
        Object.defineProperty(window, 'sessionStorage', {
            value: {
                getItem: (key: string) => storage[key] || null,
                setItem: (key: string, value: string) => {
                    storage[key] = value
                },
                removeItem: (key: string) => {
                    delete storage[key]
                },
                clear: () => {
                    Object.keys(storage).forEach(key => delete storage[key])
                },
            },
            writable: true,
        })
    }
}

// 模拟 Intl API
if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) {
    global.Intl = {
        DateTimeFormat: function () {
            return {
                resolvedOptions: () => ({ timeZone: 'America/New_York' }),
            }
        },
    } as any
}
