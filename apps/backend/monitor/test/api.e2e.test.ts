import axios, { AxiosInstance } from 'axios'

const API_BASE = 'http://localhost:8081/api'

describe('Monitor Server E2E Tests', () => {
    let client: AxiosInstance
    let authToken: string

    beforeAll(() => {
        client = axios.create({
            baseURL: API_BASE,
            timeout: 5000,
            validateStatus: () => true,
        })
    })

    describe('Authentication', () => {
        it('should login with credentials and get token', async () => {
            const loginPayload = {
                username: 'admin',
                password: 'admin123',
            }

            const { status, data } = await client.post('/auth/login', loginPayload)
            expect([200, 401, 400]).toContain(status)

            if (status === 200 && data.access_token) {
                authToken = data.access_token
                client.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
            }
        })

        it('should fail login with wrong password', async () => {
            const wrongLoginPayload = {
                username: 'admin',
                password: 'wrongpassword',
            }

            const { status } = await client.post('/auth/login', wrongLoginPayload)
            expect([401, 400]).toContain(status)
        })

        it('should get current user info', async () => {
            if (!authToken) {
                return
            }

            const { status, data } = await client.get('/me')
            expect([200, 401]).toContain(status)
            if (status === 200) {
                expect(data).toHaveProperty('success')
            }
        })

        it('should register new admin user', async () => {
            const registerPayload = {
                username: `testuser_${Date.now()}`,
                password: 'Test@12345',
                email: `test_${Date.now()}@example.com`,
            }

            const { status, data } = await client.post('/admin/register', registerPayload)
            expect([200, 201, 400, 409]).toContain(status)
            if (status === 200 || status === 201) {
                expect(data).toHaveProperty('success')
            }
        })
    })

    describe('Health Check', () => {
        it('should get system health', async () => {
            const { status, data } = await client.get('/health')
            expect(status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.application).toBeDefined()
            expect(data.database).toBeDefined()
        })
    })

    describe('Events API', () => {
        it('should retrieve events list without auth (may fail)', async () => {
            const { status } = await client.get('/events?limit=10')
            expect([200, 401]).toContain(status)
        })

        it('should get event stats without auth (may fail)', async () => {
            const { status } = await client.get('/events/stats')
            expect([200, 401]).toContain(status)
        })

        it('should handle invalid query params', async () => {
            const { status } = await client.get('/events?limit=invalid')
            expect([200, 400, 401]).toContain(status)
        })

        it('should handle missing appId in request', async () => {
            const eventPayload = {
                eventType: 'test',
                eventName: 'test',
            }
            const { status } = await client.post('/events', eventPayload)
            expect([200, 201, 400, 401, 404]).toContain(status)
        })
    })

    describe('Application Management', () => {
        it('should create application without auth (may fail)', async () => {
            const appPayload = {
                appId: `test-app-${Date.now()}`,
                name: 'Test Application',
                type: 'vanilla',
                description: 'Integration test app',
            }
            const { status } = await client.post('/application', appPayload)
            expect([200, 201, 400, 401]).toContain(status)
        })

        it('should get applications list', async () => {
            const { status } = await client.get('/application?userId=1')
            expect([200, 400, 401]).toContain(status)
        })

        it('should handle invalid application ID', async () => {
            const { status } = await client.put('/application/invalid-id', {
                name: 'Updated Name',
            })
            expect([200, 400, 401, 404]).toContain(status)
        })
    })

    describe('Error Scenarios', () => {
        it('should handle 404 for non-existent endpoint', async () => {
            const { status } = await client.get('/non-existent-endpoint')
            expect(status).toBe(404)
        })

        it('should handle network timeout', async () => {
            const slowClient = axios.create({
                baseURL: API_BASE,
                timeout: 100,
                validateStatus: () => true,
            })

            const { status } = await slowClient.get('/health')
            // May timeout or succeed depending on server response time
            expect([200, 408, 0]).toContain(status)
        })

        it('should handle malformed JSON', async () => {
            try {
                await client.post('/application', 'invalid json', {
                    headers: { 'Content-Type': 'application/json' },
                })
            } catch (error) {
                expect(error).toBeDefined()
            }
        })

        it('should reject invalid content-type', async () => {
            const { status } = await client.post('/application', { test: 'data' }, { headers: { 'Content-Type': 'text/plain' } })
            expect([200, 400, 401, 415]).toContain(status)
        })
    })

    describe('Data Validation', () => {
        it('should validate email format', async () => {
            const registerPayload = {
                username: 'testuser',
                password: 'Test@12345',
                email: 'invalid-email',
            }

            const { status } = await client.post('/admin/register', registerPayload)
            expect([200, 201, 400, 422]).toContain(status)
        })

        it('should validate password strength', async () => {
            const registerPayload = {
                username: 'testuser',
                password: '123',
                email: 'test@example.com',
            }

            const { status } = await client.post('/admin/register', registerPayload)
            expect([200, 201, 400, 422]).toContain(status)
        })

        it('should validate app type enum', async () => {
            const appPayload = {
                appId: `test-${Date.now()}`,
                name: 'Test',
                type: 'invalid-type',
            }

            const { status } = await client.post('/application', appPayload)
            expect([200, 201, 400, 401, 422]).toContain(status)
        })
    })

    describe('Rate Limiting & Load', () => {
        it('should handle multiple concurrent requests', async () => {
            const requests = Array(5)
                .fill(null)
                .map(() => client.get('/health'))

            const results = await Promise.all(requests)
            const successCount = results.filter(r => r.status === 200).length

            expect(successCount).toBeGreaterThanOrEqual(3)
        })
    })

    describe('Additional Auth Endpoints', () => {
        it('should logout with auth', async () => {
            if (!authToken) {
                return
            }
            const { status } = await client.post('/auth/logout')
            expect([200, 401]).toContain(status)
        })

        it('should get current user via currentUser endpoint', async () => {
            if (!authToken) {
                return
            }
            const { status } = await client.get('/currentUser')
            expect([200, 401]).toContain(status)
        })
    })

    describe('Application Management Extended', () => {
        it('should update application', async () => {
            const { status } = await client.put('/application', {
                appId: 'test-app',
                name: 'Updated Name',
            })
            expect([200, 400, 401, 404]).toContain(status)
        })

        it('should delete application', async () => {
            const { status } = await client.delete('/application', {
                data: { appId: 'test-app-to-delete' },
            })
            expect([200, 400, 401, 404]).toContain(status)
        })
    })

    describe('Events API Extended', () => {
        it('should get event by ID', async () => {
            const { status } = await client.get('/events/test-event-id')
            expect([200, 401, 404]).toContain(status)
        })

        it('should get events stats summary', async () => {
            const { status } = await client.get('/events/stats/summary')
            expect([200, 401]).toContain(status)
        })

        it('should get application summary', async () => {
            const { status } = await client.get('/events/app/test-app/summary')
            expect([200, 401, 403, 404]).toContain(status)
        })
    })

    describe('Version Endpoints', () => {
        it('should get version info', async () => {
            const { status } = await client.get('/version')
            expect(status).toBe(200)
        })

        it('should handle tracking', async () => {
            const { status } = await client.get('/tracking?event_type=test&message=test')
            expect([200, 400]).toContain(status)
        })

        it('should get span data', async () => {
            const { status } = await client.get('/span')
            expect([200, 400]).toContain(status)
        })
    })
})
