/**
 * 08-session-replay.js - SessionReplayIntegration 测试
 *
 * 测试 SessionReplayIntegration 的会话录制功能（rrweb）
 *
 * 测试场景 (5个)：
 * 1. 错误时触发录制 (onError模式)
 * 2. 缓冲区管理 (60秒)
 * 3. 错误后继续录制 (10秒)
 * 4. 脱敏验证 (maskAllInputs)
 * 5. 录制事件上报
 *
 * 验证字段：
 * - event_type: 'custom'
 * - category: 'sessionReplay'
 * - events 数组
 * - duration
 */

export const SessionReplayTests = {
    name: 'SessionReplay Integration',
    description: '会话录制（rrweb）',
    scenarios: [
        {
            id: 'trigger-on-error',
            name: '错误时触发录制',
            description: 'onError模式：错误发生时触发录制',
            run: async () => {
                // 先进行一些用户操作
                const button = document.createElement('button')
                button.textContent = 'Replay Test Button'
                button.style.cssText = 'padding: 10px; margin: 10px;'
                document.body.appendChild(button)

                // 点击操作
                button.click()

                await new Promise(resolve => setTimeout(resolve, 500))

                // 触发错误，应该开始录制
                setTimeout(() => {
                    throw new Error('SessionReplay Test - Error to trigger recording')
                }, 100)

                // 清理
                setTimeout(() => button.remove(), 2000)

                return 'Error triggered - session replay should start recording'
            },
        },
        {
            id: 'buffer-management',
            name: '缓冲区管理',
            description: '验证60秒缓冲区',
            run: async () => {
                // 模拟一系列用户操作
                for (let i = 0; i < 5; i++) {
                    const div = document.createElement('div')
                    div.textContent = `Buffer test ${i}`
                    document.body.appendChild(div)
                    await new Promise(resolve => setTimeout(resolve, 100))
                    div.remove()
                }

                return 'User actions for buffer test - events buffered for 60s'
            },
        },
        {
            id: 'after-error-recording',
            name: '错误后继续录制',
            description: '错误发生后继续录制10秒',
            run: async () => {
                // 触发错误
                setTimeout(() => {
                    throw new Error('SessionReplay Test - Error for after-recording')
                }, 100)

                // 错误后的操作（应该被录制）
                await new Promise(resolve => setTimeout(resolve, 500))

                const div = document.createElement('div')
                div.textContent = 'Action after error'
                div.style.cssText = 'padding: 10px; background: yellow;'
                document.body.appendChild(div)

                await new Promise(resolve => setTimeout(resolve, 500))
                div.remove()

                return 'Actions after error - should be recorded for 10s'
            },
        },
        {
            id: 'input-masking',
            name: '输入脱敏验证',
            description: '验证maskAllInputs配置',
            run: async () => {
                // 创建输入框
                const input = document.createElement('input')
                input.type = 'text'
                input.placeholder = 'Sensitive data'
                input.style.cssText = 'padding: 5px; margin: 10px;'
                document.body.appendChild(input)

                // 模拟输入
                input.value = 'Sensitive password 12345'
                input.dispatchEvent(new Event('input', { bubbles: true }))

                await new Promise(resolve => setTimeout(resolve, 500))

                // 触发错误以上报录制
                throw new Error('SessionReplay Test - Error with sensitive input')

                // 清理
                setTimeout(() => input.remove(), 1000)
            },
        },
        {
            id: 'replay-event-upload',
            name: '录制事件上报',
            description: '验证录制事件正确上报',
            run: async () => {
                // 创建一些DOM操作
                const container = document.createElement('div')
                container.id = 'replay-upload-test'
                container.style.cssText = 'padding: 20px; background: #f0f0f0; margin: 10px;'

                for (let i = 0; i < 3; i++) {
                    const item = document.createElement('div')
                    item.textContent = `Item ${i}`
                    container.appendChild(item)
                    await new Promise(resolve => setTimeout(resolve, 100))
                }

                document.body.appendChild(container)

                await new Promise(resolve => setTimeout(resolve, 300))

                // 触发错误以上报
                throw new Error('SessionReplay Test - Error to trigger replay upload')

                // 清理
                setTimeout(() => container.remove(), 2000)
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
                // 等待录制上报
                await new Promise(resolve => setTimeout(resolve, 2000))
            } catch (error) {
                results.push({
                    id: scenario.id,
                    name: scenario.name,
                    status: 'error',
                    error: error.message,
                    timestamp: new Date().toISOString(),
                })
                // 即使失败也等待
                await new Promise(resolve => setTimeout(resolve, 2000))
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

export default SessionReplayTests
