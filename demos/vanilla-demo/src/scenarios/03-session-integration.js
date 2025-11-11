/**
 * Session Integration 测试场景
 *
 * 功能：会话追踪，统计会话级指标
 * 配置：sessionTimeout, storageKey
 */

export const SessionIntegrationScenarios = {
    name: 'Session Integration',
    integration: 'SessionIntegration',
    config: {
        sessionTimeout: 30 * 60 * 1000, // 30分钟
        storageKey: 'sky-monitor-session',
    },
    scenarios: [
        {
            id: 'session-01',
            name: '新会话创建',
            description: '测试首次访问时创建新会话',
            trigger: () => {
                // 清除旧会话
                sessionStorage.removeItem('sky-monitor-session')
                // 触发一个事件来创建新会话
                console.log('[Session] New session created')
            },
            expectedFields: [
                'sessionId',
                '_session',
                '_session.startTime',
                '_session.duration',
                '_session.eventCount',
                '_session.errorCount',
                '_session.pageViews',
            ],
            expectedValues: {
                '_session.eventCount': 1,
                '_session.pageViews': 1,
            },
            dsnEndpoint: '所有端点都会附加 session 信息',
            backendQuery: '/api/sessions',
            frontendPage: '/sessions',
        },
        {
            id: 'session-02',
            name: '会话继续',
            description: '测试30分钟内事件继续使用同一会话',
            trigger: () => {
                // 触发多个事件，验证使用同一 sessionId
                console.log('[Session] Continuing session - event 1')
                setTimeout(() => console.log('[Session] Continuing session - event 2'), 500)
                setTimeout(() => console.log('[Session] Continuing session - event 3'), 1000)
            },
            expectedFields: ['sessionId', '_session.eventCount'],
            expectedValues: {
                // eventCount 应该递增
            },
            dsnEndpoint: '所有端点都会附加 session 信息',
            backendQuery: '/api/sessions',
            frontendPage: '/sessions',
        },
        {
            id: 'session-03',
            name: '会话错误计数',
            description: '测试会话中的错误计数',
            trigger: () => {
                try {
                    throw new Error('Test error for session tracking')
                } catch (error) {
                    console.log('[Session] Error counted in session')
                }
            },
            expectedFields: ['sessionId', '_session.errorCount'],
            expectedValues: {
                // errorCount 应该递增
            },
            dsnEndpoint: '所有端点都会附加 session 信息',
            backendQuery: '/api/sessions',
            frontendPage: '/sessions',
        },
    ],
}

/**
 * 运行所有 Session 场景
 */
export function runSessionScenarios(onComplete) {
    console.log('[Session Integration] Starting scenarios...')
    const scenarios = SessionIntegrationScenarios.scenarios

    let currentIndex = 0

    function runNext() {
        if (currentIndex >= scenarios.length) {
            console.log('[Session Integration] All scenarios completed')
            if (onComplete) onComplete()
            return
        }

        const scenario = scenarios[currentIndex]
        console.log(`[Session Integration] Running: ${scenario.name}`)

        try {
            scenario.trigger()
        } catch (error) {
            console.log(`[Session Integration] ${scenario.name} error:`, error)
        }

        currentIndex++
        setTimeout(runNext, 1500)
    }

    runNext()
}
