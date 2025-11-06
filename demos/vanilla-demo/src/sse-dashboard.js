/**
 * SSE 实时推送展示模块
 *
 * 展示 Sky Monitor 的 8 个 SSE 端点：
 * 1. 通用事件流
 * 2. 错误事件流
 * 3. 性能事件流
 * 4. Web Vitals 流
 * 5. 实时统计数据
 * 6. SourceMap 解析进度
 * 7. 错误突增告警
 * 8. 错误趋势更新
 */

class SSEDashboard {
    constructor(config) {
        this.config = config
        this.connections = new Map()
        this.isStarted = false
    }

    /**
     * 启动所有 SSE 连接
     */
    startAll() {
        if (this.isStarted) {
            console.warn('⚠️ SSE 已经启动')
            return
        }

        console.log('🚀 启动所有 SSE 连接...')

        // 1. 通用事件流
        this.subscribeToEvents()

        // 2. 错误事件流
        this.subscribeToErrors()

        // 3. 性能事件流
        this.subscribeToPerformance()

        // 4. Web Vitals 流
        this.subscribeToWebVitals()

        // 5. 实时统计数据
        this.subscribeToStats()

        // 7. 错误突增告警
        this.subscribeToErrorSpikes()

        // 8. 错误趋势更新
        this.subscribeToErrorTrends()

        this.isStarted = true
        this.updateStatus('所有连接已建立', 'success')
    }

    /**
     * 停止所有 SSE 连接
     */
    stopAll() {
        console.log('🛑 停止所有 SSE 连接...')

        this.connections.forEach((es, name) => {
            es.close()
            console.log(`  ✓ 已关闭: ${name}`)
        })

        this.connections.clear()
        this.isStarted = false
        this.updateStatus('所有连接已关闭', 'error')
    }

    /**
     * 1. 订阅通用事件流
     */
    subscribeToEvents() {
        const url = `${this.config.apiBaseUrl}/events/stream/events?appId=${this.config.appId}`
        const es = this.createConnection('events', url)

        es.addEventListener('new-events', event => {
            const data = JSON.parse(event.data)
            this.updateEventsList(data.data || [])
            this.logMessage('events', `收到 ${data.data?.length || 0} 条新事件`)
        })
    }

    /**
     * 2. 订阅错误事件流
     */
    subscribeToErrors() {
        const url = `${this.config.apiBaseUrl}/events/stream/errors?appId=${this.config.appId}`
        const es = this.createConnection('errors', url)

        es.addEventListener('new-errors', event => {
            const data = JSON.parse(event.data)
            this.updateErrorsList(data.data || [])
            this.logMessage('errors', `收到 ${data.data?.length || 0} 条错误`)
        })
    }

    /**
     * 3. 订阅性能事件流
     */
    subscribeToPerformance() {
        const url = `${this.config.apiBaseUrl}/events/stream/performance?appId=${this.config.appId}`
        const es = this.createConnection('performance', url)

        es.addEventListener('new-performance', event => {
            const data = JSON.parse(event.data)
            this.updatePerformanceChart(data.data || [])
            this.logMessage('performance', `收到 ${data.data?.length || 0} 条性能数据`)
        })
    }

    /**
     * 4. 订阅 Web Vitals 流
     */
    subscribeToWebVitals() {
        const url = `${this.config.apiBaseUrl}/events/stream/web-vitals?appId=${this.config.appId}`
        const es = this.createConnection('web-vitals', url)

        es.addEventListener('new-web-vitals', event => {
            const data = JSON.parse(event.data)
            this.updateWebVitals(data.data || [])
            this.logMessage('web-vitals', `更新 Web Vitals 数据`)
        })
    }

    /**
     * 5. 订阅实时统计数据
     */
    subscribeToStats() {
        const url = `${this.config.apiBaseUrl}/events/stream/stats?appId=${this.config.appId}`
        const es = this.createConnection('stats', url)

        es.addEventListener('new-stats', event => {
            const data = JSON.parse(event.data)
            this.updateStats(data.data)
            this.logMessage('stats', `更新统计数据`)
        })
    }

    /**
     * 7. 订阅错误突增告警
     */
    subscribeToErrorSpikes() {
        const url = `${this.config.apiBaseUrl}/error-analytics/stream/spikes?appId=${this.config.appId}`
        const es = this.createConnection('error-spikes', url)

        es.addEventListener('error-spike', event => {
            const data = JSON.parse(event.data)
            this.showSpikeAlert(data.data)
            this.logMessage('error-spikes', `🔥 检测到错误突增！`, 'warning')
        })
    }

    /**
     * 8. 订阅错误趋势更新
     */
    subscribeToErrorTrends() {
        const url = `${this.config.apiBaseUrl}/error-analytics/stream/trends?appId=${this.config.appId}&window=hour`
        const es = this.createConnection('error-trends', url)

        es.addEventListener('error-trends-update', event => {
            const data = JSON.parse(event.data)
            this.updateErrorTrendsChart(data.data)
            this.logMessage('error-trends', `更新错误趋势数据`)
        })
    }

    /**
     * 创建 SSE 连接
     */
    createConnection(name, url) {
        console.log(`🔗 连接 SSE: ${name}`)

        const es = new EventSource(url)

        es.onopen = () => {
            console.log(`✅ ${name} 连接成功`)
            this.updateConnectionStatus(name, true)
        }

        es.onerror = error => {
            console.error(`❌ ${name} 连接失败:`, error)
            this.updateConnectionStatus(name, false)
        }

        this.connections.set(name, es)
        return es
    }

    /**
     * 更新事件列表
     */
    updateEventsList(events) {
        const listEl = document.getElementById('events-list')
        if (!listEl) return

        events.slice(0, 10).forEach(event => {
            const item = document.createElement('div')
            item.className = 'event-item'
            item.innerHTML = `
                <div class="event-time">${new Date(event.timestamp).toLocaleTimeString()}</div>
                <div class="event-type">${event.event_type}</div>
                <div class="event-message">${event.event_data?.message || event.error_message || '-'}</div>
            `
            listEl.insertBefore(item, listEl.firstChild)
        })

        // 保留最新 20 条
        while (listEl.children.length > 20) {
            listEl.removeChild(listEl.lastChild)
        }
    }

    /**
     * 更新错误列表
     */
    updateErrorsList(errors) {
        const listEl = document.getElementById('errors-list')
        if (!listEl) return

        errors.slice(0, 10).forEach(error => {
            const item = document.createElement('div')
            item.className = 'error-item'
            item.innerHTML = `
                <div class="error-time">${new Date(error.timestamp).toLocaleTimeString()}</div>
                <div class="error-message">${error.error_message}</div>
                <div class="error-stack">${(error.error_stack || '').substring(0, 100)}...</div>
            `
            listEl.insertBefore(item, listEl.firstChild)
        })

        // 保留最新 10 条
        while (listEl.children.length > 10) {
            listEl.removeChild(listEl.lastChild)
        }
    }

    /**
     * 更新性能图表（简化版）
     */
    updatePerformanceChart(performanceData) {
        const chartEl = document.getElementById('performance-chart')
        if (!chartEl) return

        chartEl.textContent = `最近收到 ${performanceData.length} 条性能数据`
    }

    /**
     * 更新 Web Vitals
     */
    updateWebVitals(vitals) {
        const vitalsEl = document.getElementById('web-vitals-data')
        if (!vitalsEl || vitals.length === 0) return

        const latest = vitals[0]
        vitalsEl.innerHTML = `
            <div class="vital-item">
                <span class="vital-label">LCP:</span>
                <span class="vital-value">${latest.lcp?.toFixed(2) || 'N/A'}s</span>
            </div>
            <div class="vital-item">
                <span class="vital-label">FID:</span>
                <span class="vital-value">${latest.fid?.toFixed(2) || 'N/A'}ms</span>
            </div>
            <div class="vital-item">
                <span class="vital-label">CLS:</span>
                <span class="vital-value">${latest.cls?.toFixed(3) || 'N/A'}</span>
            </div>
        `
    }

    /**
     * 更新统计数据
     */
    updateStats(stats) {
        const updateElement = (id, value) => {
            const el = document.getElementById(id)
            if (el) el.textContent = value
        }

        updateElement('stat-total-events', stats?.totalEvents || 0)
        updateElement('stat-total-errors', stats?.totalErrors || 0)
        updateElement('stat-active-users', stats?.activeUsers || 0)
        updateElement('stat-error-rate', `${((stats?.errorRate || 0) * 100).toFixed(2)}%`)
    }

    /**
     * 显示突增告警
     */
    showSpikeAlert(spikes) {
        const alertEl = document.getElementById('spike-alerts')
        if (!alertEl || !spikes || spikes.length === 0) return

        spikes.forEach(spike => {
            const alert = document.createElement('div')
            alert.className = 'spike-alert'
            alert.innerHTML = `
                <div class="alert-icon">🔥</div>
                <div class="alert-content">
                    <div class="alert-title">错误突增检测</div>
                    <div class="alert-message">
                        当前: ${spike.current_count} 次 (${spike.spike_multiplier}x 基准值)
                    </div>
                    <div class="alert-time">${new Date(spike.detection_time).toLocaleString()}</div>
                </div>
            `
            alertEl.insertBefore(alert, alertEl.firstChild)
        })

        // 保留最新 5 条
        while (alertEl.children.length > 5) {
            alertEl.removeChild(alertEl.lastChild)
        }
    }

    /**
     * 更新错误趋势图表（简化版）
     */
    updateErrorTrendsChart(trendsData) {
        const chartEl = document.getElementById('error-trends-chart')
        if (!chartEl) return

        chartEl.textContent = `错误趋势数据已更新 (${trendsData?.data?.length || 0} 个数据点)`
    }

    /**
     * 更新连接状态
     */
    updateConnectionStatus(name, connected) {
        const statusEl = document.getElementById(`sse-status-${name}`)
        if (!statusEl) return

        statusEl.textContent = connected ? '● 已连接' : '○ 断开'
        statusEl.style.color = connected ? '#10b981' : '#ef4444'
    }

    /**
     * 更新总体状态
     */
    updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('sse-overall-status')
        if (!statusEl) return

        statusEl.textContent = message

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#667eea',
        }

        statusEl.style.color = colors[type] || colors.info
    }

    /**
     * 记录日志消息
     */
    logMessage(source, message, level = 'info') {
        const logEl = document.getElementById('sse-logs')
        if (!logEl) return

        const logItem = document.createElement('div')
        logItem.className = `log-item log-${level}`
        logItem.innerHTML = `
            <span class="log-time">[${new Date().toLocaleTimeString()}]</span>
            <span class="log-source">[${source}]</span>
            <span class="log-message">${message}</span>
        `
        logEl.insertBefore(logItem, logEl.firstChild)

        // 保留最新 50 条
        while (logEl.children.length > 50) {
            logEl.removeChild(logEl.lastChild)
        }
    }
}

// 导出实例
window.SSEDashboard = SSEDashboard

// 自动初始化
window.addEventListener('load', () => {
    if (window.MONITOR_CONFIG) {
        window.sseDashboard = new SSEDashboard(window.MONITOR_CONFIG)
        console.log('✅ SSE Dashboard 已初始化')
    }
})
