/**
 * 测试辅助函数
 *
 * 提供通用的测试工具方法，简化测试编写
 */

export const TestHelpers = {
    /**
     * 等待指定时间
     * @param {number} ms - 等待毫秒数
     * @returns {Promise<void>}
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    },

    /**
     * 格式化时间戳为可读字符串
     * @param {string|number|Date} timestamp - 时间戳
     * @returns {string}
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp)
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
    },

    /**
     * 格式化持续时间
     * @param {number} ms - 毫秒数
     * @returns {string}
     */
    formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`
        if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
        return `${(ms / 60000).toFixed(2)}min`
    },

    /**
     * 显示测试结果
     * @param {string} containerId - 容器 DOM ID
     * @param {object} result - 测试结果
     */
    displayTestResult(containerId, result) {
        const container = document.getElementById(containerId)
        if (!container) return

        const statusClass = result.status === 'passed' ? 'text-green-600' : 'text-red-600'
        const statusIcon = result.status === 'passed' ? '✓' : '✗'

        container.innerHTML = `
            <div class="test-result ${statusClass}">
                <span class="${statusClass}">${statusIcon}</span>
                <span>${result.name}</span>
                ${result.error ? `<p class="error-msg">${result.error}</p>` : ''}
            </div>
        `
    },

    /**
     * 批量运行测试
     * @param {Array} tests - 测试数组
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<Array>}
     */
    async runTests(tests, onProgress) {
        const results = []

        for (let i = 0; i < tests.length; i++) {
            const test = tests[i]

            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: tests.length,
                    testName: test.name,
                })
            }

            try {
                const startTime = Date.now()
                await test.run()
                const duration = Date.now() - startTime

                results.push({
                    id: test.id,
                    name: test.name,
                    status: 'passed',
                    duration,
                })
            } catch (error) {
                results.push({
                    id: test.id,
                    name: test.name,
                    status: 'failed',
                    error: error.message,
                })
            }
        }

        return results
    },

    /**
     * 从 localStorage 读取数据
     * @param {string} key - 键名
     * @param {any} defaultValue - 默认值
     * @returns {any}
     */
    getFromStorage(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key)
            return value ? JSON.parse(value) : defaultValue
        } catch (error) {
            return defaultValue
        }
    },

    /**
     * 保存数据到 localStorage
     * @param {string} key - 键名
     * @param {any} value - 值
     */
    saveToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
            console.error('Failed to save to storage:', error)
        }
    },

    /**
     * 生成随机字符串
     * @param {number} length - 长度
     * @returns {string}
     */
    randomString(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let result = ''
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
    },

    /**
     * 深度克隆对象
     * @param {any} obj - 要克隆的对象
     * @returns {any}
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj))
    },

    /**
     * 安全地显示 HTML（防止 XSS）
     * @param {string} str - 字符串
     * @returns {string}
     */
    escapeHtml(str) {
        const div = document.createElement('div')
        div.textContent = str
        return div.innerHTML
    },

    /**
     * 检测测试环境
     * @returns {object}
     */
    getEnvironment() {
        return {
            browser: navigator.userAgent,
            language: navigator.language,
            online: navigator.onLine,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        }
    },

    /**
     * 生成测试报告
     * @param {Array} results - 测试结果数组
     * @returns {object}
     */
    generateReport(results) {
        const passed = results.filter(r => r.status === 'passed').length
        const failed = results.filter(r => r.status === 'failed').length
        const total = results.length
        const successRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0'

        return {
            total,
            passed,
            failed,
            successRate: `${successRate}%`,
            details: results,
            timestamp: new Date().toISOString(),
            environment: this.getEnvironment(),
        }
    },

    /**
     * 下载测试报告为 JSON 文件
     * @param {object} report - 测试报告
     * @param {string} filename - 文件名
     */
    downloadReport(report, filename = 'test-report.json') {
        const dataStr = JSON.stringify(report, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)

        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()

        URL.revokeObjectURL(url)
    },

    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     * @returns {Promise<boolean>}
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text)
            return true
        } catch (error) {
            return false
        }
    },

    /**
     * 显示通知消息
     * @param {string} message - 消息内容
     * @param {string} type - 类型 (success|error|info)
     */
    showNotification(message, type = 'info') {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
        }

        const notification = document.createElement('div')
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `
        notification.textContent = message

        document.body.appendChild(notification)

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out'
            setTimeout(() => {
                document.body.removeChild(notification)
            }, 300)
        }, 3000)
    },
}

// 添加动画样式
const style = document.createElement('style')
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .test-result {
        padding: 8px;
        margin: 4px 0;
        border-radius: 4px;
        background: #f9fafb;
    }

    .text-green-600 {
        color: #10b981;
    }

    .text-red-600 {
        color: #ef4444;
    }

    .error-msg {
        margin-top: 4px;
        font-size: 0.875rem;
        color: #6b7280;
    }
`
document.head.appendChild(style)
