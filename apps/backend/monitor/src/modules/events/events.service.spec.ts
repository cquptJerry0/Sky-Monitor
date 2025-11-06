import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { EventsService } from './events.service'

describe('EventsService', () => {
    let service: EventsService
    let mockClickhouseClient: any

    beforeEach(async () => {
        // Mock ClickHouseClient
        mockClickhouseClient = {
            query: vi.fn(),
            insert: vi.fn(),
        }

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsService,
                {
                    provide: 'CLICKHOUSE_CLIENT',
                    useValue: mockClickhouseClient,
                },
            ],
        }).compile()

        service = module.get<EventsService>(EventsService)
    })

    describe('getEvents', () => {
        it('应该返回事件列表', async () => {
            const mockData = {
                data: [
                    { id: '1', event_type: 'error', session_id: 'session-1' },
                    { id: '2', event_type: 'performance', session_id: 'session-1' },
                ],
            }

            mockClickhouseClient.query.mockResolvedValueOnce({
                json: vi.fn().mockResolvedValue(mockData),
            })
            mockClickhouseClient.query.mockResolvedValueOnce({
                json: vi.fn().mockResolvedValue({ data: [{ total: 2 }] }),
            })

            const result = await service.getEvents({ appId: 'test-app', limit: 10 })

            expect(result.data).toEqual(mockData.data)
            expect(result.total).toBe(2)
            expect(mockClickhouseClient.query).toHaveBeenCalledTimes(2)
        })

        it('应该正确处理查询参数', async () => {
            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue({ data: [] }),
            })

            await service.getEvents({
                appId: 'test-app',
                eventType: 'error',
                limit: 20,
                offset: 10,
                startTime: '2024-01-01',
                endTime: '2024-01-31',
            })

            const queryCall = mockClickhouseClient.query.mock.calls[0][0].query
            expect(queryCall).toContain("app_id = 'test-app'")
            expect(queryCall).toContain("event_type = 'error'")
            expect(queryCall).toContain('LIMIT 20')
            expect(queryCall).toContain('OFFSET 10')
        })
    })

    describe('getSessions', () => {
        it('应该返回会话列表', async () => {
            const mockData = {
                data: [
                    {
                        session_id: 'session-1',
                        start_time: 1234567890,
                        event_count: 10,
                        error_count: 2,
                    },
                ],
            }

            mockClickhouseClient.query.mockResolvedValueOnce({
                json: vi.fn().mockResolvedValue(mockData),
            })
            mockClickhouseClient.query.mockResolvedValueOnce({
                json: vi.fn().mockResolvedValue({ data: [{ total: 1 }] }),
            })

            const result = await service.getSessions({ appId: 'test-app' })

            expect(result.data).toEqual(mockData.data)
            expect(result.total).toBe(1)
        })

        it('应该支持分页参数', async () => {
            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue({ data: [] }),
            })

            await service.getSessions({ appId: 'test-app', limit: 20, offset: 10 })

            const queryCall = mockClickhouseClient.query.mock.calls[0][0].query
            expect(queryCall).toContain('LIMIT 20')
            expect(queryCall).toContain('OFFSET 10')
        })

        it('应该按会话ID分组', async () => {
            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue({ data: [] }),
            })

            await service.getSessions({ appId: 'test-app' })

            const queryCall = mockClickhouseClient.query.mock.calls[0][0].query
            expect(queryCall).toContain('GROUP BY session_id')
        })
    })

    describe('getEventsBySession', () => {
        it('应该返回指定会话的所有事件', async () => {
            const mockData = {
                data: [
                    { id: '1', session_id: 'session-1', event_type: 'error' },
                    { id: '2', session_id: 'session-1', event_type: 'message' },
                ],
            }

            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue(mockData),
            })

            const result = await service.getEventsBySession('session-1')

            expect(result.data).toEqual(mockData.data)
            expect(result.total).toBe(2)
        })

        it('应该按时间升序排列', async () => {
            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue({ data: [] }),
            })

            await service.getEventsBySession('session-1')

            const queryCall = mockClickhouseClient.query.mock.calls[0][0].query
            expect(queryCall).toContain('ORDER BY timestamp ASC')
        })
    })

    describe('getSlowRequests', () => {
        it('应该返回慢请求列表', async () => {
            const mockData = {
                data: [
                    {
                        http_url: '/api/slow',
                        http_method: 'GET',
                        avg_duration: 3500,
                        count: 10,
                    },
                ],
            }

            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue(mockData),
            })

            const result = await service.getSlowRequests({ appId: 'test-app' })

            expect(result.data).toEqual(mockData.data)
            expect(result.threshold).toBe(3000)
        })

        it('应该支持自定义阈值', async () => {
            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue({ data: [] }),
            })

            await service.getSlowRequests({ appId: 'test-app', threshold: 5000 })

            const queryCall = mockClickhouseClient.query.mock.calls[0][0].query
            expect(queryCall).toContain('http_duration > 5000')
        })

        it('应该按 URL 和 Method 分组', async () => {
            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue({ data: [] }),
            })

            await service.getSlowRequests({ appId: 'test-app' })

            const queryCall = mockClickhouseClient.query.mock.calls[0][0].query
            expect(queryCall).toContain('GROUP BY http_url, http_method')
        })
    })

    describe('getErrorGroups', () => {
        it('应该返回错误聚合数据', async () => {
            const mockData = {
                data: [
                    {
                        error_fingerprint: 'fp-1',
                        error_message: 'Test Error',
                        total_count: 15,
                        affected_users: 3,
                        affected_sessions: 5,
                    },
                ],
            }

            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue(mockData),
            })

            const result = await service.getErrorGroups({ appId: 'test-app' })

            expect(result.data).toEqual(mockData.data)
        })

        it('应该按错误指纹分组', async () => {
            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue({ data: [] }),
            })

            await service.getErrorGroups({ appId: 'test-app' })

            const queryCall = mockClickhouseClient.query.mock.calls[0][0].query
            expect(queryCall).toContain('GROUP BY error_fingerprint')
            expect(queryCall).toContain('SUM(dedup_count)')
        })

        it('应该统计影响的用户和会话数', async () => {
            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue({ data: [] }),
            })

            await service.getErrorGroups({ appId: 'test-app' })

            const queryCall = mockClickhouseClient.query.mock.calls[0][0].query
            expect(queryCall).toContain('uniq(user_id)')
            expect(queryCall).toContain('uniq(session_id)')
        })
    })

    describe('getUserEvents', () => {
        it('应该返回指定用户的事件', async () => {
            const mockData = {
                data: [
                    { id: '1', user_id: 'user-1', event_type: 'error' },
                    { id: '2', user_id: 'user-1', event_type: 'message' },
                ],
            }

            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue(mockData),
            })

            const result = await service.getUserEvents({ userId: 'user-1', appId: 'test-app' })

            expect(result.data).toEqual(mockData.data)
            expect(result.total).toBe(2)
        })

        it('应该过滤指定用户ID', async () => {
            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue({ data: [] }),
            })

            await service.getUserEvents({ userId: 'user-123', appId: 'test-app' })

            const queryCall = mockClickhouseClient.query.mock.calls[0][0].query
            expect(queryCall).toContain("user_id = 'user-123'")
        })
    })

    describe('getSamplingStats', () => {
        it('应该返回采样率统计', async () => {
            const mockData = {
                data: [
                    { event_type: 'error', avg_rate: 1.0, sampled_count: 100, estimated_total: 100 },
                    { event_type: 'performance', avg_rate: 0.3, sampled_count: 30, estimated_total: 100 },
                ],
            }

            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue(mockData),
            })

            const result = await service.getSamplingStats('test-app')

            expect(result.data).toEqual(mockData.data)
        })

        it('应该按事件类型分组', async () => {
            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue({ data: [] }),
            })

            await service.getSamplingStats('test-app')

            const queryCall = mockClickhouseClient.query.mock.calls[0][0].query
            expect(queryCall).toContain('GROUP BY event_type')
            expect(queryCall).toContain('AVG(sampling_rate)')
        })
    })

    describe('getAppSummary', () => {
        it('应该返回增强的应用摘要', async () => {
            const mockData = {
                data: [
                    {
                        total_events: 100,
                        error_count: 10,
                        session_count: 20,
                        user_count: 15,
                        slow_request_count: 5,
                        total_error_occurrences: 50,
                    },
                ],
            }

            mockClickhouseClient.query.mockResolvedValue({
                json: vi.fn().mockResolvedValue(mockData),
            })

            const result = await service.getAppSummary('test-app')

            expect(result).toEqual(mockData.data[0])
            expect((result as any).session_count).toBeDefined()
            expect((result as any).user_count).toBeDefined()
            expect((result as any).slow_request_count).toBeDefined()
        })
    })
})
