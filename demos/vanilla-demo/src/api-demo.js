/**
 * API 调用示例模块
 *
 * 展示 Sky Monitor 后端 API 的使用方法
 */

class APIDemo {
    constructor(config) {
        this.config = config
        this.token = localStorage.getItem('sky_monitor_token') || 'demo_token_123'
    }

    /**
     * 通用 API 请求方法
     */
    async request(endpoint, options = {}) {
        const url = `${this.config.apiBaseUrl}${endpoint}`

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`,
                    ...options.headers,
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            return await response.json()
        } catch (error) {
            console.error(`❌ API 请求失败 [${endpoint}]:`, error)
            throw error
        }
    }

    // ==================== 事件查询 API ====================

    /**
     * 获取事件列表
     */
    async getEvents(params = {}) {
        const query = new URLSearchParams({
            appId: this.config.appId,
            limit: 50,
            ...params,
        })

        return await this.request(`/events?${query}`)
    }

    /**
     * 获取单个事件详情
     */
    async getEventById(eventId) {
        return await this.request(`/events/${eventId}`)
    }

    /**
     * 获取用户事件
     */
    async getUserEvents(userId, params = {}) {
        const query = new URLSearchParams({
            ...params,
        })

        return await this.request(`/events/user/${userId}/events?${query}`)
    }

    /**
     * 获取统计数据
     */
    async getStats() {
        const query = new URLSearchParams({
            appId: this.config.appId,
        })

        return await this.request(`/events/stats?${query}`)
    }

    // ==================== 错误分析 API ====================

    /**
     * 获取智能错误聚合
     */
    async getSmartErrorGroups(threshold = 0.8, limit = 50) {
        const query = new URLSearchParams({
            appId: this.config.appId,
            threshold: threshold.toString(),
            limit: limit.toString(),
        })

        return await this.request(`/error-analytics/smart-groups?${query}`)
    }

    /**
     * 获取错误趋势
     */
    async getErrorTrends(window = 'hour', fingerprint = '', limit = 24) {
        const query = new URLSearchParams({
            appId: this.config.appId,
            window,
            limit: limit.toString(),
        })

        if (fingerprint) {
            query.append('fingerprint', fingerprint)
        }

        return await this.request(`/error-analytics/trends?${query}`)
    }

    /**
     * 对比多个错误趋势
     */
    async compareErrorTrends(fingerprints, window = 'hour', limit = 24) {
        const query = new URLSearchParams({
            appId: this.config.appId,
            fingerprints: fingerprints.join(','),
            window,
            limit: limit.toString(),
        })

        return await this.request(`/error-analytics/trends/compare?${query}`)
    }

    /**
     * 检测错误突增
     */
    async detectErrorSpikes(window = 'hour', lookback = 24) {
        const query = new URLSearchParams({
            appId: this.config.appId,
            window,
            lookback: lookback.toString(),
        })

        return await this.request(`/error-analytics/spike-detection?${query}`)
    }

    /**
     * 获取最近的错误突增告警
     */
    async getRecentSpikes(limit = 10) {
        const query = new URLSearchParams({
            appId: this.config.appId,
            limit: limit.toString(),
        })

        return await this.request(`/error-analytics/recent-spikes?${query}`)
    }

    // ==================== SourceMap API ====================

    /**
     * 查询 SourceMap 解析状态
     */
    async getSourceMapStatuses(eventIds) {
        const query = new URLSearchParams({
            eventIds: eventIds.join(','),
        })

        return await this.request(`/events/sourcemap/status?${query}`)
    }

    // ==================== UI 更新方法 ====================

    /**
     * 显示 API 响应
     */
    displayAPIResponse(apiName, data) {
        const resultEl = document.getElementById('api-result')
        if (!resultEl) return

        const resultCard = document.createElement('div')
        resultCard.className = 'api-result-card'
        resultCard.innerHTML = `
            <div class="api-result-header">
                <span class="api-name">${apiName}</span>
                <span class="api-time">${new Date().toLocaleTimeString()}</span>
            </div>
            <pre class="api-result-body">${JSON.stringify(data, null, 2)}</pre>
        `

        resultEl.insertBefore(resultCard, resultEl.firstChild)

        // 保留最新 5 条
        while (resultEl.children.length > 5) {
            resultEl.removeChild(resultEl.lastChild)
        }
    }

    /**
     * 显示错误
     */
    displayError(apiName, error) {
        const resultEl = document.getElementById('api-result')
        if (!resultEl) return

        const errorCard = document.createElement('div')
        errorCard.className = 'api-result-card api-error'
        errorCard.innerHTML = `
            <div class="api-result-header">
                <span class="api-name">${apiName}</span>
                <span class="api-time">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="api-error-message">${error.message}</div>
        `

        resultEl.insertBefore(errorCard, resultEl.firstChild)
    }
}

// ==================== 测试函数 ====================

/**
 * 测试获取事件列表
 */
window.testGetEvents = async function () {
    console.log('📊 测试：获取事件列表')
    try {
        const api = new APIDemo(window.MONITOR_CONFIG)
        const result = await api.getEvents({ limit: 10, eventType: 'error' })
        console.log('✅ 成功:', result)
        api.displayAPIResponse('GET /events', result)
    } catch (error) {
        console.error('❌ 失败:', error)
        new APIDemo(window.MONITOR_CONFIG).displayError('GET /events', error)
    }
}

/**
 * 测试获取统计数据
 */
window.testGetStats = async function () {
    console.log('📊 测试：获取统计数据')
    try {
        const api = new APIDemo(window.MONITOR_CONFIG)
        const result = await api.getStats()
        console.log('✅ 成功:', result)
        api.displayAPIResponse('GET /events/stats', result)
    } catch (error) {
        console.error('❌ 失败:', error)
        new APIDemo(window.MONITOR_CONFIG).displayError('GET /events/stats', error)
    }
}

/**
 * 测试智能错误聚合
 */
window.testSmartErrorGroups = async function () {
    console.log('📊 测试：智能错误聚合')
    try {
        const api = new APIDemo(window.MONITOR_CONFIG)
        const result = await api.getSmartErrorGroups(0.8, 20)
        console.log('✅ 成功:', result)
        api.displayAPIResponse('GET /error-analytics/smart-groups', result)
    } catch (error) {
        console.error('❌ 失败:', error)
        new APIDemo(window.MONITOR_CONFIG).displayError('GET /error-analytics/smart-groups', error)
    }
}

/**
 * 测试错误趋势
 */
window.testErrorTrends = async function () {
    console.log('📊 测试：错误趋势分析')
    try {
        const api = new APIDemo(window.MONITOR_CONFIG)
        const result = await api.getErrorTrends('hour', '', 24)
        console.log('✅ 成功:', result)
        api.displayAPIResponse('GET /error-analytics/trends', result)
    } catch (error) {
        console.error('❌ 失败:', error)
        new APIDemo(window.MONITOR_CONFIG).displayError('GET /error-analytics/trends', error)
    }
}

/**
 * 测试错误突增检测
 */
window.testDetectSpikes = async function () {
    console.log('📊 测试：错误突增检测')
    try {
        const api = new APIDemo(window.MONITOR_CONFIG)
        const result = await api.detectErrorSpikes('hour', 24)
        console.log('✅ 成功:', result)
        api.displayAPIResponse('GET /error-analytics/spike-detection', result)
    } catch (error) {
        console.error('❌ 失败:', error)
        new APIDemo(window.MONITOR_CONFIG).displayError('GET /error-analytics/spike-detection', error)
    }
}

/**
 * 测试获取最近突增
 */
window.testGetRecentSpikes = async function () {
    console.log('📊 测试：获取最近突增')
    try {
        const api = new APIDemo(window.MONITOR_CONFIG)
        const result = await api.getRecentSpikes(10)
        console.log('✅ 成功:', result)
        api.displayAPIResponse('GET /error-analytics/recent-spikes', result)
    } catch (error) {
        console.error('❌ 失败:', error)
        new APIDemo(window.MONITOR_CONFIG).displayError('GET /error-analytics/recent-spikes', error)
    }
}

// 导出
window.APIDemo = APIDemo

// 自动初始化
window.addEventListener('load', () => {
    if (window.MONITOR_CONFIG) {
        window.apiDemo = new APIDemo(window.MONITOR_CONFIG)
        console.log('✅ API Demo 已初始化')
    }
})
