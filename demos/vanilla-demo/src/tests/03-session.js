/**
 * 03-session.js - SessionIntegration 测试
 *
 * 测试 SessionIntegration 的会话跟踪功能
 *
 * 测试场景 (6个)：
 * 1. 初始会话创建
 * 2. 会话ID持久化 (sessionStorage)
 * 3. 会话超时验证 (30分钟)
 * 4. 页面可见性切换
 * 5. 页面卸载前保存
 * 6. 会话指标累加
 *
 * 验证字段：
 * - session_id
 * - session_start_time
 * - session_duration
 * - session_event_count
 * - session_error_count
 * - session_page_views
 */

export const SessionTests = {
    name: 'Session Integration',
    description: '会话跟踪',
    scenarios: [
        {
            id: 'session-creation',
            name: '会话创建',
            description: '验证初始会话ID生成',
            run: () => {
                const sessionData = sessionStorage.getItem('sky-monitor-session')
                if (sessionData) {
                    const session = JSON.parse(sessionData)
                    return `Session created: ${session.sessionId}`
                }
                return 'No session found - will be created on first event'
            },
        },
        {
            id: 'session-persistence',
            name: '会话持久化',
            description: '验证sessionStorage存储',
            run: () => {
                const sessionData = sessionStorage.getItem('sky-monitor-session')
                if (!sessionData) {
                    throw new Error('Session not found in sessionStorage')
                }

                const session = JSON.parse(sessionData)
                if (!session.sessionId || !session.startTime) {
                    throw new Error('Invalid session data structure')
                }

                return `Session persisted: ${session.sessionId}`
            },
        },
        {
            id: 'session-timeout',
            name: '会话超时',
            description: '验证30分钟超时机制（仅模拟）',
            run: () => {
                const sessionData = sessionStorage.getItem('sky-monitor-session')
                if (sessionData) {
                    const session = JSON.parse(sessionData)
                    const lastActivity = session.lastActivityTime
                    const timeout = 30 * 60 * 1000 // 30分钟
                    const timeRemaining = timeout - (Date.now() - lastActivity)

                    return `Session timeout: ${Math.round(timeRemaining / 1000 / 60)} minutes remaining`
                }
                return 'No active session'
            },
        },
        {
            id: 'visibility-change',
            name: '可见性切换',
            description: '触发页面隐藏/显示事件',
            run: async () => {
                // 模拟页面可见性变化
                const event = new Event('visibilitychange')
                Object.defineProperty(document, 'hidden', {
                    writable: true,
                    configurable: true,
                    value: true,
                })
                document.dispatchEvent(event)

                await new Promise(resolve => setTimeout(resolve, 100))

                Object.defineProperty(document, 'hidden', {
                    writable: true,
                    configurable: true,
                    value: false,
                })
                document.dispatchEvent(event)

                return 'Visibility change events triggered'
            },
        },
        {
            id: 'before-unload',
            name: '页面卸载',
            description: '触发beforeunload事件',
            run: () => {
                const event = new Event('beforeunload')
                window.dispatchEvent(event)
                return 'Before unload event triggered - session should be saved'
            },
        },
        {
            id: 'session-metrics',
            name: '会话指标累加',
            description: '验证事件计数和错误计数',
            run: () => {
                const sessionData = sessionStorage.getItem('sky-monitor-session')
                if (!sessionData) {
                    return 'No session data - metrics will be accumulated with events'
                }

                const session = JSON.parse(sessionData)
                return `Session metrics: ${session.eventCount} events, ${session.errorCount} errors, ${session.pageViews} page views`
            },
        },
    ],

    async runAll() {
        const results = []
        for (const scenario of this.scenarios) {
            try {
                const message = await scenario.run()
                results.push({
                    id: scenario.id,
                    name: scenario.name,
                    status: 'success',
                    message,
                    timestamp: new Date().toISOString(),
                })
            } catch (error) {
                results.push({
                    id: scenario.id,
                    name: scenario.name,
                    status: 'error',
                    error: error.message,
                    timestamp: new Date().toISOString(),
                })
            }
        }
        return results
    },

    async runScenario(scenarioId) {
        const scenario = this.scenarios.find(s => s.id === scenarioId)
        if (!scenario) {
            throw new Error(`Scenario ${scenarioId} not found`)
        }

        try {
            const message = await scenario.run()
            return {
                id: scenario.id,
                name: scenario.name,
                status: 'success',
                message,
                timestamp: new Date().toISOString(),
            }
        } catch (error) {
            return {
                id: scenario.id,
                name: scenario.name,
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString(),
            }
        }
    },
}

export default SessionTests
