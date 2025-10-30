import { describe, expect, it } from 'vitest'

const API_BASE = 'http://localhost:8080/api'

describe('DSN Server API Tests (Port 8080)', () => {
    const timeout = 5000

    async function makeRequest(
        method: string,
        endpoint: string,
        data: Record<string, unknown> | null = null
    ): Promise<{ status: number; data?: unknown; error?: string }> {
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
        }

        if (data) {
            options.body = JSON.stringify(data)
        }

        try {
            const response = await Promise.race([
                fetch(`${API_BASE}${endpoint}`, options),
                new Promise<Response>((_, reject) => {
                    setTimeout(() => reject(new Error('Request timeout')), timeout)
                }),
            ])
            return { status: response.status, data: await response.json() }
        } catch (err) {
            const error = err as Error
            return { status: 0, error: error.message }
        }
    }

    describe('Monitoring Health Endpoints', () => {
        it('should verify event data pipeline', async () => {
            const result = await makeRequest('GET', '/monitoring/health/pipeline')
            expect(result.status).toBe(200)
            expect(result.data).toHaveProperty('success')
        })

        it('should retrieve recent events', async () => {
            const result = await makeRequest('GET', '/monitoring/health/recent-events?limit=5')
            expect(result.status).toBe(200)
            expect(result.data).toHaveProperty('data')
        })

        it('should check ClickHouse table status', async () => {
            const result = await makeRequest('GET', '/monitoring/health/table-status')
            expect(result.status).toBe(200)
            expect(result.data).toHaveProperty('success')
        })

        it('should provide DSN diagnostics', async () => {
            const result = await makeRequest('GET', '/monitoring/health/diagnostics')
            expect(result.status).toBe(200)
            expect(result.data).toHaveProperty('diagnostics')
        })
    })

    describe('Test Event Endpoints', () => {
        it('should send test event to DSN', async () => {
            const eventPayload = {
                appId: 'test-app-dsn',
                eventType: 'test',
                message: `Test DSN event - ${new Date().toISOString()}`,
            }
            const result = await makeRequest('POST', '/monitoring/health/test-event', eventPayload)
            expect([200, 201]).toContain(result.status)
        })
    })

    describe('Application Management', () => {
        it('should retrieve applications list', async () => {
            const result = await makeRequest('GET', '/monitoring/applications?userId=1')
            expect(result.status).toBe(200)
            expect(result.data).toHaveProperty('data')
        })
    })

    describe('Server Connectivity', () => {
        it('should confirm DSN server is running on port 8080', async () => {
            const result = await makeRequest('GET', '/monitoring/health/pipeline')
            if (result.status === 0) {
                console.error(
                    `DSN Server not running on ${API_BASE}. Error: ${result.error}\n` +
                        'Start the DSN server with: pnpm dev:server:dsn\n' +
                        'or from the project root: pnpm start'
                )
            }
            expect(result.status).toBe(200)
        })
    })
})
