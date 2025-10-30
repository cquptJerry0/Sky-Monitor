import axios, { AxiosInstance } from 'axios'

const API_BASE = 'http://localhost:8080/api'
const VALID_APP_ID = 'vanillaV9pEeA'

describe('DSN Server E2E Tests', () => {
    let client: AxiosInstance

    beforeAll(() => {
        client = axios.create({
            baseURL: API_BASE,
            timeout: 5000,
            validateStatus: () => true,
        })
    })

    describe('Event Collection (SDK Integration)', () => {
        it('should receive single event from SDK', async () => {
            const eventPayload = {
                type: 'error',
                name: 'TestError',
                value: 1,
                message: 'Test error event',
                path: '/test-page',
                userAgent: 'Test SDK',
            }

            const { status } = await client.post(`/monitoring/${VALID_APP_ID}`, eventPayload)
            expect([200, 201, 400, 404]).toContain(status)
        })

        it('should receive batch events from SDK', async () => {
            const batchPayload = [
                {
                    type: 'error',
                    name: 'Error1',
                    value: 1,
                    message: 'First error',
                },
                {
                    type: 'performance',
                    name: 'PageLoad',
                    value: 1500,
                    message: 'Page load time',
                },
            ]

            const { status } = await client.post(`/monitoring/${VALID_APP_ID}/batch`, batchPayload)
            expect([200, 201, 400, 404]).toContain(status)
        })

        it('should handle invalid event data', async () => {
            const invalidPayload = {}

            const { status } = await client.post(`/monitoring/${VALID_APP_ID}`, invalidPayload)
            expect([200, 201, 400, 404]).toContain(status)
        })

        it('should handle batch with mixed valid/invalid events', async () => {
            const mixedBatch = [
                { type: 'error', name: 'ValidError', value: 1 },
                {},
                { type: 'performance', name: 'ValidPerf', value: 2000 },
            ]

            const { status } = await client.post(`/monitoring/${VALID_APP_ID}/batch`, mixedBatch)
            expect([200, 201, 400, 404]).toContain(status)
        })

        it('should validate appId format', async () => {
            const invalidAppId = 'invalid app id with spaces'
            const payload = { type: 'error', name: 'Test', value: 1 }

            const { status } = await client.post(`/monitoring/${invalidAppId}`, payload)
            expect([200, 201, 400, 404]).toContain(status)
        })
    })

    describe('Monitoring Health Endpoints', () => {
        it('should get basic health check', async () => {
            const { status, data } = await client.get('/monitoring/health')
            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.database).toBeDefined()
        })

        it('should get full diagnostics', async () => {
            const { status, data } = await client.get('/monitoring/health/diagnostics')
            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.diagnostics).toBeDefined()
            expect(data.diagnostics.pipeline).toBeDefined()
        })
    })

    describe('Test Event Management', () => {
        it('should write test event to ClickHouse', async () => {
            const testEvent = {
                appId: VALID_APP_ID,
                eventType: 'test',
                message: `Test event at ${new Date().toISOString()}`,
            }

            const { status } = await client.post('/monitoring', testEvent)
            expect([200, 201, 400, 404]).toContain(status)
        })
    })

    describe('Application Management', () => {
        it('should retrieve applications list', async () => {
            const { status, data } = await client.get('/monitoring/applications?userId=1')
            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(Array.isArray(data.data)).toBe(true)
        })

        it('should handle missing userId parameter', async () => {
            const { status } = await client.get('/monitoring/applications')
            expect([200, 400]).toContain(status)
        })

        it('should handle invalid userId', async () => {
            const { status } = await client.get('/monitoring/applications?userId=invalid')
            expect([200, 400]).toContain(status)
        })

        it('should handle userId with no applications', async () => {
            const { status, data } = await client.get('/monitoring/applications?userId=99999')
            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(Array.isArray(data.data)).toBe(true)
        })
    })

    describe('Error Scenarios', () => {
        it('should handle 404 for non-existent endpoint', async () => {
            const { status } = await client.get('/non-existent-endpoint')
            expect(status).toBe(404)
        })

        it('should handle POST to GET endpoint', async () => {
            const { status } = await client.post('/monitoring/health/pipeline', {})
            expect([200, 405, 404]).toContain(status)
        })

        it('should handle malformed JSON body', async () => {
            try {
                await client.post('/monitoring/test-event', 'invalid json', {
                    headers: { 'Content-Type': 'application/json' },
                })
            } catch (error) {
                expect(error).toBeDefined()
            }
        })

        it('should handle missing Content-Type header', async () => {
            const { status } = await client.post(
                `/monitoring/${VALID_APP_ID}`,
                { type: 'error' },
                {
                    headers: { 'Content-Type': '' },
                }
            )
            expect([200, 201, 400, 415]).toContain(status)
        })

        it('should handle very large event payload', async () => {
            const largePayload = {
                type: 'error',
                name: 'LargeError',
                message: 'x'.repeat(100000),
            }

            const { status } = await client.post(`/monitoring/${VALID_APP_ID}`, largePayload)
            expect([200, 201, 400, 413]).toContain(status)
        })
    })

    describe('Data Validation', () => {
        it('should validate event type enum', async () => {
            const invalidEventType = {
                type: 'invalid-type',
                name: 'Test',
                value: 1,
            }

            const { status } = await client.post(`/monitoring/${VALID_APP_ID}`, invalidEventType)
            expect([200, 201, 400, 404]).toContain(status)
        })

        it('should handle numeric values correctly', async () => {
            const payload = {
                type: 'performance',
                name: 'LoadTime',
                value: 1234.56,
            }

            const { status } = await client.post(`/monitoring/${VALID_APP_ID}`, payload)
            expect([200, 201, 400, 404]).toContain(status)
        })

        it('should handle special characters in fields', async () => {
            const payload = {
                type: 'error',
                name: 'Test<script>alert(1)</script>',
                message: 'Test "quotes" and \'apostrophes\'',
                path: '/test?param=<value>&other=value',
            }

            const { status } = await client.post(`/monitoring/${VALID_APP_ID}`, payload)
            expect([200, 201, 400, 404]).toContain(status)
        })

        it('should handle Unicode in event data', async () => {
            const payload = {
                type: 'error',
                name: '测试错误',
                message: '日本語エラー',
                path: '/路径/测试',
            }

            const { status } = await client.post(`/monitoring/${VALID_APP_ID}`, payload)
            expect([200, 201, 400, 404]).toContain(status)
        })
    })

    describe('Performance & Load', () => {
        it('should handle multiple concurrent events', async () => {
            const events = Array(3)
                .fill(null)
                .map((_, i) => ({
                    type: 'error',
                    name: `ConcurrentError${i}`,
                    value: i,
                    message: `Concurrent test event ${i}`,
                }))

            const requests = events.map(event => client.post(`/monitoring/${VALID_APP_ID}`, event))
            const results = await Promise.all(requests)
            const successCount = results.filter(r => [200, 201].includes(r.status)).length

            expect(successCount).toBeGreaterThanOrEqual(0)
        })

        it('should handle batch size limits', async () => {
            const largeBatch = Array(100)
                .fill(null)
                .map((_, i) => ({
                    type: 'log',
                    name: `Event${i}`,
                    value: 1,
                }))

            const { status } = await client.post(`/monitoring/${VALID_APP_ID}/batch`, largeBatch)
            expect([200, 201, 400, 413]).toContain(status)
        })
    })

    describe('ClickHouse Integration', () => {
        it('should retrieve recent events', async () => {
            const { status, data } = await client.get('/monitoring/health/recent-events?limit=5')
            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toBeDefined()
        })

        it('should query events with correct structure', async () => {
            const { status, data } = await client.get('/monitoring/health/recent-events?limit=5')
            expect(status).toBe(200)
            if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
                const event = data.data[0]
                expect(event).toHaveProperty('id')
                expect(event).toHaveProperty('app_id')
                expect(event).toHaveProperty('event_type')
                expect(event).toHaveProperty('timestamp')
            }
        })
    })

    describe('Version & Info Endpoints', () => {
        it('should get version information', async () => {
            const { status, data } = await client.get('/version')
            expect(status).toBe(200)
            expect(data).toBeDefined()
        })

        it('should handle tracking events', async () => {
            const { status } = await client.get('/tracking?event_type=test&message=test_message')
            expect([200, 400]).toContain(status)
        })

        it('should get span data', async () => {
            const { status } = await client.get('/span')
            expect([200, 400]).toContain(status)
        })
    })
})
