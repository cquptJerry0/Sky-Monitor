/**
 * event-monitor.js - 实时事件监控UI
 *
 * 显示最近20条上报事件的详情
 */

import { getEventTypeIcon, formatTimestamp, dom } from '../utils/test-helpers.js'

class EventMonitor {
    constructor(containerId) {
        this.container = document.getElementById(containerId)
        this.events = []
        this.maxEvents = 20
        this.isPaused = false
        this.autoScroll = true

        this.init()
        this.startMonitoring()
    }

    init() {
        if (!this.container) {
            console.error('Event monitor container not found')
            return
        }

        this.render()
        this.attachEvents()
    }

    render() {
        this.container.innerHTML = `
            <div class="event-monitor">
                <div class="monitor-header">
                    <h3>实时事件监控</h3>
                    <div class="monitor-actions">
                        <button id="pause-monitor" class="btn btn-sm">暂停</button>
                        <button id="clear-events" class="btn btn-sm">清空</button>
                        <button id="export-events" class="btn btn-sm">导出</button>
                    </div>
                </div>
                
                <div class="monitor-stats" id="monitor-stats">
                    <div class="stat-item">
                        <span class="stat-label">总计:</span>
                        <span class="stat-value" id="total-events">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">错误:</span>
                        <span class="stat-value error" id="error-events">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">性能:</span>
                        <span class="stat-value" id="perf-events">0</span>
                    </div>
                </div>
                
                <div class="event-list" id="event-list">
                    <div class="empty-state">等待事件上报...</div>
                </div>
            </div>
        `
    }

    attachEvents() {
        // 暂停/恢复
        dom.$('#pause-monitor')?.addEventListener('click', e => {
            this.isPaused = !this.isPaused
            e.target.textContent = this.isPaused ? '恢复' : '暂停'
        })

        // 清空
        dom.$('#clear-events')?.addEventListener('click', () => {
            this.clearEvents()
        })

        // 导出
        dom.$('#export-events')?.addEventListener('click', () => {
            this.exportEvents()
        })
    }

    startMonitoring() {
        // 监听 SDK 的事件上报
        // 这里模拟监听，实际应该钩子 SDK 的 transport
        this.interceptSDKEvents()

        // 定期更新统计
        setInterval(() => {
            this.updateStats()
        }, 1000)
    }

    interceptSDKEvents() {
        // 拦截 SDK 的 fetch 请求以监控事件上报
        const originalFetch = window.fetch
        const self = this

        window.fetch = async function (...args) {
            const url = args[0]

            // 检查是否是监控事件上报
            if (typeof url === 'string' && url.includes('/api/monitoring/')) {
                const response = await originalFetch.apply(this, args)

                // 尝试解析请求体
                try {
                    const requestBody = args[1]?.body
                    if (requestBody) {
                        const data = JSON.parse(requestBody)

                        // 单个事件或批量事件
                        if (Array.isArray(data)) {
                            data.forEach(event => self.addEvent(event, response.ok))
                        } else {
                            self.addEvent(data, response.ok)
                        }
                    }
                } catch (e) {
                    // 解析失败，忽略
                }

                return response
            }

            return originalFetch.apply(this, args)
        }
    }

    addEvent(event, success = true) {
        if (this.isPaused) return

        const monitorEvent = {
            ...event,
            _monitorTimestamp: Date.now(),
            _monitorStatus: success ? 'success' : 'failed',
        }

        this.events.unshift(monitorEvent)

        // 限制事件数量
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(0, this.maxEvents)
        }

        this.renderEvents()
        this.updateStats()
    }

    renderEvents() {
        const listEl = dom.$('#event-list')
        if (!listEl) return

        if (this.events.length === 0) {
            listEl.innerHTML = '<div class="empty-state">等待事件上报...</div>'
            return
        }

        listEl.innerHTML = this.events
            .map((event, index) => {
                return this.renderEvent(event, index)
            })
            .join('')

        // 自动滚动到顶部
        if (this.autoScroll) {
            listEl.scrollTop = 0
        }
    }

    renderEvent(event, index) {
        const icon = getEventTypeIcon(event.type)
        const time = formatTimestamp(event._monitorTimestamp || event.timestamp)
        const status = event._monitorStatus === 'success' ? '✅' : '❌'

        return `
            <div class="event-item ${event.type}" data-index="${index}">
                <div class="event-header">
                    <span class="event-icon">${icon}</span>
                    <span class="event-type">${event.type}</span>
                    <span class="event-time">${time}</span>
                    <span class="event-status">${status}</span>
                </div>
                <div class="event-content">
                    ${this.renderEventContent(event)}
                </div>
            </div>
        `
    }

    renderEventContent(event) {
        switch (event.type) {
            case 'error':
                return `
                    <div class="event-message">${event.message || 'Unknown error'}</div>
                    ${event.stack ? `<div class="event-stack">${this.truncate(event.stack, 100)}</div>` : ''}
                `

            case 'webVital':
                return `
                    <div class="event-metric">
                        <strong>${event.name}:</strong> ${event.value}${event.unit || ''}
                    </div>
                `

            case 'performance':
                return `
                    <div class="event-perf">
                        ${event.url || event.name}: ${event.duration || event.value}ms
                        ${event.isSlow ? '<span class="badge-slow">慢</span>' : ''}
                    </div>
                `

            case 'custom':
                return `
                    <div class="event-custom">
                        ${event.category}: ${event.name}
                    </div>
                `

            default:
                return `<div class="event-default">${event.name || event.type}</div>`
        }
    }

    truncate(text, maxLength) {
        if (text.length <= maxLength) return text
        return text.substring(0, maxLength) + '...'
    }

    updateStats() {
        const total = this.events.length
        const errors = this.events.filter(e => e.type === 'error').length
        const perf = this.events.filter(e => e.type === 'performance' || e.type === 'webVital').length

        const totalEl = dom.$('#total-events')
        const errorEl = dom.$('#error-events')
        const perfEl = dom.$('#perf-events')

        if (totalEl) totalEl.textContent = total
        if (errorEl) errorEl.textContent = errors
        if (perfEl) perfEl.textContent = perf
    }

    clearEvents() {
        this.events = []
        this.renderEvents()
        this.updateStats()
    }

    exportEvents() {
        const dataStr = JSON.stringify(this.events, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)

        const link = document.createElement('a')
        link.href = url
        link.download = `monitor-events-${Date.now()}.json`
        link.click()

        URL.revokeObjectURL(url)
    }
}

// 初始化事件监控
export function initEventMonitor(containerId = 'event-monitor') {
    return new EventMonitor(containerId)
}

export default EventMonitor
