import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as alertsService from '@/services/alerts'
import * as eventsService from '@/services/events'

vi.mock('@/utils/request', () => ({
    request: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}))

describe('Integration: API Services', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Events Service', () => {
        it('should fetch HTTP errors', async () => {
            const mockRequest = await import('@/utils/request')
            const mockData = {
                data: {
                    data: [
                        {
                            id: '1',
                            http_url: 'https://api.example.com/test',
                            http_method: 'GET',
                            http_status: 500,
                        },
                    ],
                },
            }

            vi.mocked(mockRequest.request.get).mockResolvedValue(mockData)

            const result = await eventsService.fetchHttpErrors({ limit: 10 })

            expect(result.success).toBe(true)
            expect(result.data.data).toHaveLength(1)
        })

        it('should fetch resource errors', async () => {
            const mockRequest = await import('@/utils/request')
            const mockData = {
                data: {
                    data: [
                        {
                            id: '1',
                            resource_url: 'https://cdn.example.com/image.png',
                            resource_type: 'img',
                        },
                    ],
                },
            }

            vi.mocked(mockRequest.request.get).mockResolvedValue(mockData)

            const result = await eventsService.fetchResourceErrors({ limit: 10 })

            expect(result.success).toBe(true)
            expect(result.data.data).toHaveLength(1)
        })

        it('should fetch web vitals', async () => {
            const mockRequest = await import('@/utils/request')
            const mockData = {
                data: {
                    data: [
                        {
                            id: '1',
                            event_name: 'LCP',
                            perf_value: 2500,
                        },
                    ],
                    total: 1,
                },
            }

            vi.mocked(mockRequest.request.get).mockResolvedValue(mockData)

            const result = await eventsService.fetchWebVitals({ limit: 10 })

            expect(result.success).toBe(true)
            expect(result.data.data).toHaveLength(1)
        })
    })

    describe('Alerts Service', () => {
        it('should fetch alert rules', async () => {
            const mockRequest = await import('@/utils/request')
            const mockData = {
                data: [
                    {
                        id: '1',
                        name: 'Test Alert',
                        type: 'error_rate',
                        threshold: 10,
                    },
                ],
            }

            vi.mocked(mockRequest.request.get).mockResolvedValue(mockData)

            const result = await alertsService.fetchAlertRules()

            expect(result.data).toHaveLength(1)
        })

        it('should create alert rule', async () => {
            const mockRequest = await import('@/utils/request')
            const mockData = {
                success: true,
                data: {
                    id: '1',
                    name: 'New Alert',
                    type: 'error_rate',
                    threshold: 15,
                },
            }

            vi.mocked(mockRequest.request.post).mockResolvedValue(mockData)

            const result = await alertsService.createAlertRule({
                app_id: 'test-app',
                name: 'New Alert',
                type: 'error_rate',
                threshold: 15,
                window: '5m',
            })

            expect(result.success).toBe(true)
            expect(result.data.name).toBe('New Alert')
        })

        it('should update alert rule', async () => {
            const mockRequest = await import('@/utils/request')
            const mockData = {
                success: true,
                data: {
                    id: '1',
                    name: 'Updated Alert',
                },
            }

            vi.mocked(mockRequest.request.put).mockResolvedValue(mockData)

            const result = await alertsService.updateAlertRule('1', {
                name: 'Updated Alert',
            })

            expect(result.success).toBe(true)
            expect(result.data.name).toBe('Updated Alert')
        })

        it('should delete alert rule', async () => {
            const mockRequest = await import('@/utils/request')
            const mockData = {
                success: true,
                message: 'Alert rule deleted successfully',
            }

            vi.mocked(mockRequest.request.delete).mockResolvedValue(mockData)

            const result = await alertsService.deleteAlertRule('1')

            expect(result.success).toBe(true)
        })
    })
})
