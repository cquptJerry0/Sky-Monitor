/**
 * test-helpers.js - 测试辅助函数
 *
 * 提供测试运行、结果展示、状态管理等通用工具方法
 */

/**
 * 测试事件总线
 */
class EventBus {
    constructor() {
        this.listeners = {}
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = []
        }
        this.listeners[event].push(callback)
    }

    off(event, callback) {
        if (!this.listeners[event]) return
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }

    emit(event, data) {
        if (!this.listeners[event]) return
        this.listeners[event].forEach(callback => callback(data))
    }
}

export const testEventBus = new EventBus()

/**
 * 测试状态枚举
 */
export const TestStatus = {
    PENDING: 'pending',
    RUNNING: 'running',
    SUCCESS: 'success',
    ERROR: 'error',
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

/**
 * 格式化持续时间
 */
export function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

/**
 * 获取状态图标
 */
export function getStatusIcon(status) {
    switch (status) {
        case TestStatus.SUCCESS:
            return '✅'
        case TestStatus.ERROR:
            return '❌'
        case TestStatus.RUNNING:
            return '⏳'
        case TestStatus.PENDING:
        default:
            return '⏸️'
    }
}

/**
 * 获取事件类型图标
 */
export function getEventTypeIcon(eventType) {
    switch (eventType) {
        case 'error':
            return '🔴'
        case 'webVital':
        case 'performance':
            return '📊'
        case 'custom':
            return '🎬'
        default:
            return '📝'
    }
}

/**
 * 创建测试结果元素
 */
export function createResultElement(result) {
    const div = document.createElement('div')
    div.className = `test-result test-result-${result.status}`
    div.innerHTML = `
        <div class="result-header">
            <span class="result-icon">${getStatusIcon(result.status)}</span>
            <span class="result-name">${result.name}</span>
            <span class="result-time">${formatTimestamp(result.timestamp)}</span>
        </div>
        ${result.message ? `<div class="result-message">${result.message}</div>` : ''}
        ${result.error ? `<div class="result-error">${result.error}</div>` : ''}
    `
    return div
}

/**
 * 本地存储工具
 */
export const storage = {
    get(key) {
        try {
            const value = localStorage.getItem(key)
            return value ? JSON.parse(value) : null
        } catch (e) {
            return null
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value))
            return true
        } catch (e) {
            return false
        }
    },

    remove(key) {
        localStorage.removeItem(key)
    },

    clear() {
        localStorage.clear()
    },
}

/**
 * 延迟执行
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 安全执行函数
 */
export async function safeExecute(fn, errorMessage = 'Execution failed') {
    try {
        return await fn()
    } catch (error) {
        console.error(errorMessage, error)
        throw error
    }
}

/**
 * 计算测试进度
 */
export function calculateProgress(results) {
    const total = results.length
    const completed = results.filter(r => r.status === TestStatus.SUCCESS || r.status === TestStatus.ERROR).length
    const success = results.filter(r => r.status === TestStatus.SUCCESS).length
    const errors = results.filter(r => r.status === TestStatus.ERROR).length

    return {
        total,
        completed,
        success,
        errors,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        successRate: completed > 0 ? Math.round((success / completed) * 100) : 0,
    }
}

/**
 * DOM工具
 */
export const dom = {
    $: selector => document.querySelector(selector),
    $$: selector => document.querySelectorAll(selector),

    create: (tag, className, content) => {
        const el = document.createElement(tag)
        if (className) el.className = className
        if (content) el.textContent = content
        return el
    },

    append: (parent, ...children) => {
        children.forEach(child => {
            if (typeof child === 'string') {
                parent.appendChild(document.createTextNode(child))
            } else {
                parent.appendChild(child)
            }
        })
        return parent
    },

    remove: el => {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el)
        }
    },

    empty: el => {
        while (el.firstChild) {
            el.removeChild(el.firstChild)
        }
    },
}

/**
 * 导出结果为JSON
 */
export function exportResults(results, filename = 'test-results.json') {
    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()

    URL.revokeObjectURL(url)
}

/**
 * 生成测试报告
 */
export function generateReport(testResults) {
    const progress = calculateProgress(testResults)
    const timestamp = new Date().toISOString()

    return {
        timestamp,
        summary: {
            total: progress.total,
            completed: progress.completed,
            success: progress.success,
            errors: progress.errors,
            percentage: progress.percentage,
            successRate: progress.successRate,
        },
        results: testResults,
    }
}
