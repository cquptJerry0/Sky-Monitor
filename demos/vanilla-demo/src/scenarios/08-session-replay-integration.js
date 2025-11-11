/**
 * SessionReplay Integration 测试场景
 *
 * 功能：会话回放（基于 rrweb）
 * 配置：mode, sampleRate, bufferDuration, afterErrorDuration, maskAllInputs, maskTextClass, blockClass, ignoreClass, fps, maxEvents
 */

export const SessionReplayIntegrationScenarios = {
    name: 'SessionReplay Integration',
    integration: 'SessionReplayIntegration',
    config: {
        mode: 'onError', // 'always' | 'onError' | 'sampled'
        sampleRate: 0.1,
        bufferDuration: 60, // 60秒
        afterErrorDuration: 10, // 错误后继续录制10秒
        maskAllInputs: true,
        maskTextClass: 'sky-monitor-mask',
        blockClass: 'sky-monitor-block',
        ignoreClass: 'sky-monitor-ignore',
        fps: 10,
        maxEvents: 100,
        recordCanvas: false,
        recordCrossOriginIframes: false,
    },
    scenarios: [
        {
            id: 'replay-01',
            name: '错误时录制',
            description: '测试错误发生时自动录制会话（前60秒+后10秒）',
            trigger: () => {
                // 先进行一些用户交互
                console.log('[SessionReplay] User interaction 1')
                setTimeout(() => {
                    console.log('[SessionReplay] User interaction 2')
                }, 500)

                // 1秒后触发错误
                setTimeout(() => {
                    try {
                        throw new Error('Test error to trigger session replay')
                    } catch (error) {
                        console.log('[SessionReplay] Error triggered, replay should be captured')
                    }
                }, 1000)

                // 错误后继续交互
                setTimeout(() => {
                    console.log('[SessionReplay] User interaction after error')
                }, 2000)
            },
            expectedFields: ['type', 'category', 'name', 'extra', 'extra.events', 'extra.eventCount', 'extra.duration', 'timestamp'],
            expectedValues: {
                type: 'custom',
                category: 'sessionReplay',
                name: 'replay-events',
            },
            dsnEndpoint: '/api/monitoring/:appId/session-replay',
            backendQuery: '/api/sessions/:id/replay',
            frontendPage: '/sessions/:sessionId/replay',
        },
        {
            id: 'replay-02',
            name: '隐私脱敏',
            description: '测试输入框内容被正确脱敏',
            trigger: () => {
                // 创建输入框
                const input = document.createElement('input')
                input.type = 'text'
                input.placeholder = 'Type something (will be masked)'
                input.style.cssText = 'padding: 10px; margin: 10px;'
                document.body.appendChild(input)

                // 模拟输入
                setTimeout(() => {
                    input.value = 'Sensitive Data 123'
                    input.dispatchEvent(new Event('input', { bubbles: true }))
                }, 500)

                // 触发错误以录制
                setTimeout(() => {
                    try {
                        throw new Error('Test error for privacy check')
                    } catch (error) {
                        console.log('[SessionReplay] Error triggered for privacy test')
                    }
                    document.body.removeChild(input)
                }, 1000)
            },
            expectedFields: ['extra.events'],
            expectedValues: {
                // 验证录制事件中输入内容被脱敏
            },
            dsnEndpoint: '/api/monitoring/:appId/session-replay',
            backendQuery: '/api/sessions/:id/replay',
            frontendPage: '/sessions/:sessionId/replay',
        },
    ],
}

/**
 * 运行所有 SessionReplay 场景
 */
export function runSessionReplayScenarios(onComplete) {
    console.log('[SessionReplay Integration] Starting scenarios...')
    console.log('[SessionReplay Integration] Note: Replay only triggers on error in "onError" mode')

    const scenarios = SessionReplayIntegrationScenarios.scenarios
    let currentIndex = 0

    function runNext() {
        if (currentIndex >= scenarios.length) {
            console.log('[SessionReplay Integration] All scenarios completed')
            if (onComplete) onComplete()
            return
        }

        const scenario = scenarios[currentIndex]
        console.log(`[SessionReplay Integration] Running: ${scenario.name}`)

        try {
            scenario.trigger()
        } catch (error) {
            console.log(`[SessionReplay Integration] ${scenario.name} error:`, error)
        }

        currentIndex++
        // 给足够的时间录制和上传
        setTimeout(runNext, 5000)
    }

    runNext()
}
