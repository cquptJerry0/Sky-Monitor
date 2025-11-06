import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { MonitoringService } from './monitoring.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ApplicationEntity } from '../../entities/application.entity'

describe('MonitoringService', () => {
    let service: MonitoringService
    let mockClickhouseClient: any
    let mockApplicationRepository: any
    let mockParseQueue: any

    beforeEach(async () => {
        // Mock ClickHouseClient
        mockClickhouseClient = {
            insert: vi.fn().mockResolvedValue(undefined),
            query: vi.fn(),
            command: vi.fn(),
        }

        // Mock ApplicationRepository
        mockApplicationRepository = {
            findOne: vi.fn(),
            findAndCount: vi.fn(),
        }

        // Mock Bull Queue
        mockParseQueue = {
            add: vi.fn().mockResolvedValue(undefined),
        }

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MonitoringService,
                {
                    provide: 'CLICKHOUSE_CLIENT',
                    useValue: mockClickhouseClient,
                },
                {
                    provide: getRepositoryToken(ApplicationEntity),
                    useValue: mockApplicationRepository,
                },
                {
                    provide: 'BullQueue_sourcemap-parser',
                    useValue: mockParseQueue,
                },
            ],
        }).compile()

        service = module.get<MonitoringService>(MonitoringService)
    })

    describe('receiveEvent', () => {
        it('应该接收包含所有新字段的事件', async () => {
            const event = {
                type: 'error',
                message: 'Test error',
                stack: 'Error: Test\n  at test.js:1:1',

                // Session 字段
                sessionId: 'session-123',
                _session: {
                    startTime: 1234567890,
                    duration: 5000,
                    eventCount: 10,
                    errorCount: 2,
                    pageViews: 3,
                },

                // User 字段
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                    username: 'testuser',
                    ip_address: '127.0.0.1',
                },

                // Scope 字段
                tags: { env: 'test' },
                extra: { customData: 'value' },
                breadcrumbs: [{ message: 'Click button', timestamp: 123456 }],
                contexts: { app: { name: 'TestApp' } },

                // Level
                level: 'error',
                environment: 'test',

                // Deduplication
                _deduplication: {
                    fingerprint: 'fp-123',
                    count: 5,
                },

                // Sampling
                _sampling: {
                    rate: 1.0,
                    sampled: true,
                    timestamp: 123456,
                },
            }

            await service.receiveEvent('test-app', event, 'TestAgent/1.0')

            expect(mockClickhouseClient.insert).toHaveBeenCalledTimes(1)
            const insertCall = mockClickhouseClient.insert.mock.calls[0][0]
            const insertedData = insertCall.values[0]

            // 验证 Session 字段
            expect(insertedData.session_id).toBe('session-123')
            expect(insertedData.session_start_time).toBe(1234567890)
            expect(insertedData.session_event_count).toBe(10)

            // 验证 User 字段
            expect(insertedData.user_id).toBe('user-123')
            expect(insertedData.user_email).toBe('test@example.com')

            // 验证 Scope 字段（JSON 序列化）
            expect(insertedData.tags).toContain('env')
            expect(insertedData.breadcrumbs).toContain('Click button')

            // 验证元数据
            expect(insertedData.dedup_count).toBe(5)
            expect(insertedData.sampling_rate).toBe(1.0)
        })

        it('应该正确处理 Performance 事件', async () => {
            const event = {
                type: 'performance',
                category: 'http',
                url: '/api/test',
                method: 'GET',
                status: 200,
                duration: 3500,
                isSlow: true,
                success: true,
                value: 3500,
                metrics: { ttfb: 100, download: 200 },
            }

            await service.receiveEvent('test-app', event)

            const insertedData = mockClickhouseClient.insert.mock.calls[0][0].values[0]

            expect(insertedData.perf_category).toBe('http')
            expect(insertedData.perf_value).toBe(3500)
            expect(insertedData.perf_is_slow).toBe(1)
            expect(insertedData.perf_success).toBe(1)
            expect(insertedData.perf_metrics).toContain('ttfb')
        })

        it('应该处理缺失的可选字段', async () => {
            const minimalEvent = {
                type: 'message',
                message: 'Simple message',
            }

            await service.receiveEvent('test-app', minimalEvent)

            const insertedData = mockClickhouseClient.insert.mock.calls[0][0].values[0]

            // 缺失字段应该有默认值
            expect(insertedData.session_id).toBe('')
            expect(insertedData.user_id).toBe('')
            expect(insertedData.tags).toBe('')
            expect(insertedData.dedup_count).toBe(1)
            expect(insertedData.sampling_rate).toBe(1.0)
        })
    })

    describe('receiveBatchEvents', () => {
        it('应该批量接收包含新字段的事件', async () => {
            const events = [
                {
                    type: 'error',
                    message: 'Error 1',
                    sessionId: 'session-1',
                    user: { id: 'user-1' },
                    _deduplication: { fingerprint: 'fp-1', count: 3 },
                },
                {
                    type: 'performance',
                    category: 'http',
                    isSlow: true,
                    sessionId: 'session-1',
                },
            ]

            await service.receiveBatchEvents('test-app', events)

            expect(mockClickhouseClient.insert).toHaveBeenCalledTimes(1)
            const insertCall = mockClickhouseClient.insert.mock.calls[0][0]
            const insertedData = insertCall.values

            expect(insertedData).toHaveLength(2)
            expect(insertedData[0].session_id).toBe('session-1')
            expect(insertedData[0].dedup_count).toBe(3)
            expect(insertedData[1].perf_is_slow).toBe(1)
        })

        it('应该正确序列化 JSON 字段', async () => {
            const events = [
                {
                    type: 'error',
                    message: 'Test',
                    tags: { key1: 'value1', key2: 'value2' },
                    breadcrumbs: [{ message: 'Action 1' }, { message: 'Action 2' }],
                },
            ]

            await service.receiveBatchEvents('test-app', events)

            const insertedData = mockClickhouseClient.insert.mock.calls[0][0].values[0]

            // tags 应该是 JSON 字符串
            expect(() => JSON.parse(insertedData.tags)).not.toThrow()
            const parsedTags = JSON.parse(insertedData.tags)
            expect(parsedTags.key1).toBe('value1')

            // breadcrumbs 应该是 JSON 字符串
            expect(() => JSON.parse(insertedData.breadcrumbs)).not.toThrow()
            const parsedBreadcrumbs = JSON.parse(insertedData.breadcrumbs)
            expect(parsedBreadcrumbs).toHaveLength(2)
        })
    })

    describe('validateAppId', () => {
        it('应该验证有效的 appId', async () => {
            mockApplicationRepository.findOne.mockResolvedValue({
                appId: 'valid-app',
                name: 'Test App',
            })

            const result = await service.validateAppId('valid-app')

            expect(result).toBe(true)
            expect(mockApplicationRepository.findOne).toHaveBeenCalledWith({
                where: { appId: 'valid-app' },
            })
        })

        it('应该拒绝无效的 appId', async () => {
            mockApplicationRepository.findOne.mockResolvedValue(null)

            await expect(service.validateAppId('invalid-app')).rejects.toThrow()
        })
    })
})
