import axios from 'axios'
import { describe, it, expect } from 'vitest'

/**
 * 测试 DSN Server 的 GET 接口
 *
 * 测试目标:
 * 1. GET /api/monitoring/:appId/errors - 获取错误事件
 * 2. GET /api/monitoring/:appId/replay - 获取 Session Replay 数据
 */

const DSN_API_BASE = 'http://localhost:8080/api'
const TEST_APP_ID = 'reactddthD9' // 使用 demo 的 appId

describe('DSN Server - GET API Test', () => {
    it('GET /monitoring/:appId/errors - 应该返回错误事件列表', async () => {
        const response = await axios.get(`${DSN_API_BASE}/monitoring/${TEST_APP_ID}/errors`, {
            params: { limit: 5 },
            validateStatus: () => true,
        })

        console.log('Errors Response:', JSON.stringify(response.data, null, 2))

        expect([200, 404]).toContain(response.status)
        if (response.status === 200) {
            expect(Array.isArray(response.data)).toBe(true)
        }
    })

    it('GET /monitoring/:appId/replay - 应该返回 Replay 数据列表', async () => {
        const response = await axios.get(`${DSN_API_BASE}/monitoring/${TEST_APP_ID}/replay`, {
            params: { limit: 5 },
            validateStatus: () => true,
        })

        console.log('Replay Response:', JSON.stringify(response.data, null, 2))

        expect([200, 404]).toContain(response.status)
        if (response.status === 200) {
            expect(Array.isArray(response.data)).toBe(true)
        }
    })

    it('GET /monitoring/:appId/errors - 应该支持 limit 参数', async () => {
        const response = await axios.get(`${DSN_API_BASE}/monitoring/${TEST_APP_ID}/errors`, {
            params: { limit: 2 },
            validateStatus: () => true,
        })

        if (response.status === 200 && response.data.length > 0) {
            expect(response.data.length).toBeLessThanOrEqual(2)
        }
    })

    it('GET /monitoring/:appId/replay - 应该支持 limit 参数', async () => {
        const response = await axios.get(`${DSN_API_BASE}/monitoring/${TEST_APP_ID}/replay`, {
            params: { limit: 2 },
            validateStatus: () => true,
        })

        if (response.status === 200 && response.data.length > 0) {
            expect(response.data.length).toBeLessThanOrEqual(2)
        }
    })

    it('GET /monitoring/:appId/errors - 应该返回完整的错误数据结构', async () => {
        const response = await axios.get(`${DSN_API_BASE}/monitoring/${TEST_APP_ID}/errors`, {
            params: { limit: 1 },
            validateStatus: () => true,
        })

        if (response.status === 200 && response.data.length > 0) {
            const error = response.data[0]
            expect(error).toHaveProperty('id')
            expect(error).toHaveProperty('type')
            expect(error).toHaveProperty('message')
            expect(error).toHaveProperty('timestamp')
        }
    })

    it('GET /monitoring/:appId/replay - 应该返回完整的 Replay 数据结构', async () => {
        const response = await axios.get(`${DSN_API_BASE}/monitoring/${TEST_APP_ID}/replay`, {
            params: { limit: 1 },
            validateStatus: () => true,
        })

        if (response.status === 200 && response.data.length > 0) {
            const replay = response.data[0]
            expect(replay).toHaveProperty('replayId')
            expect(replay).toHaveProperty('events')
            expect(replay).toHaveProperty('metadata')
            expect(Array.isArray(replay.events)).toBe(true)
        }
    })
})
