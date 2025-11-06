import { Test, TestingModule } from '@nestjs/testing'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ErrorAggregationService } from '../services/error-aggregation.service'
import { ErrorSimilarityService } from '../services/error-similarity.service'

describe('ErrorAggregationService', () => {
    let service: ErrorAggregationService
    let similarityService: ErrorSimilarityService
    let mockClickhouseClient: any
    let mockRedis: any

    beforeEach(async () => {
        // Mock ClickHouse Client
        mockClickhouseClient = {
            query: vi.fn().mockResolvedValue({
                json: vi.fn().mockResolvedValue({
                    data: [
                        {
                            error_fingerprint: 'fp1',
                            error_message: "Cannot read property 'name' of undefined",
                            error_stack: 'stack1',
                            total_count: '100',
                            first_seen: '2024-01-01',
                            last_seen: '2024-01-10',
                            affected_users: 10,
                            affected_sessions: 20,
                            framework: 'React',
                            browser: 'Chrome',
                            os: 'Windows',
                        },
                        {
                            error_fingerprint: 'fp2',
                            error_message: "Cannot read property 'age' of undefined",
                            error_stack: 'stack2',
                            total_count: '80',
                            first_seen: '2024-01-02',
                            last_seen: '2024-01-09',
                            affected_users: 8,
                            affected_sessions: 15,
                            framework: 'React',
                            browser: 'Chrome',
                            os: 'Windows',
                        },
                    ],
                }),
            }),
            insert: vi.fn().mockResolvedValue(undefined),
        }

        // Mock Redis
        mockRedis = {
            status: 'ready',
            get: vi.fn().mockResolvedValue(null),
            setex: vi.fn().mockResolvedValue('OK'),
            connect: vi.fn().mockResolvedValue(undefined),
        }

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ErrorAggregationService,
                ErrorSimilarityService,
                {
                    provide: 'CLICKHOUSE_CLIENT',
                    useValue: mockClickhouseClient,
                },
            ],
        }).compile()

        service = module.get<ErrorAggregationService>(ErrorAggregationService)
        similarityService = module.get<ErrorSimilarityService>(ErrorSimilarityService)

        // Replace Redis instance
        ;(service as any).redis = mockRedis

        // Mock errorSimilarityService's normalize method (accessed as private in aggregation service)
        const mockSimilarityService = {
            normalize: vi.fn((msg: string) => msg.toLowerCase().replace(/\d+/g, 'X').trim()),
            calculateSimilarity: vi.fn((msg1: string, msg2: string) => 0.9),
        }
        ;(service as any).errorSimilarityService = mockSimilarityService
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('getErrorGroups', () => {
        it('should return error groups from ClickHouse', async () => {
            const result = await service.getErrorGroups({ appId: 'test-app', limit: 100 })

            expect(result.data).toHaveLength(2)
            expect(result.total).toBe(2)
            expect(mockClickhouseClient.query).toHaveBeenCalled()
        })

        it('should handle errors gracefully', async () => {
            mockClickhouseClient.query.mockRejectedValueOnce(new Error('DB error'))

            await expect(service.getErrorGroups({ appId: 'test-app' })).rejects.toThrow('DB error')
        })
    })

    describe('getSmartErrorGroups', () => {
        it('should return cached result if available', async () => {
            const cachedResult = {
                data: [],
                total: 0,
                originalGroups: 5,
                mergedGroups: 3,
            }
            mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedResult))

            const result = await service.getSmartErrorGroups({ appId: 'test-app', threshold: 0.8, limit: 100 })

            expect(result).toEqual(cachedResult)
            expect(mockRedis.get).toHaveBeenCalledWith('smart_error_groups:test-app:0.8:100')
        })

        it('should perform aggregation when cache misses', async () => {
            mockRedis.get.mockResolvedValueOnce(null)

            const result = await service.getSmartErrorGroups({ appId: 'test-app', threshold: 0.85, limit: 100 })

            expect(result.data).toBeDefined()
            expect(result.originalGroups).toBe(2)
            expect(result.mergedGroups).toBeLessThanOrEqual(2)
            expect(mockRedis.setex).toHaveBeenCalled()
        })

        it('should merge similar errors based on threshold', async () => {
            mockRedis.get.mockResolvedValueOnce(null)

            // Two very similar error messages should merge at 0.8 threshold
            const result = await service.getSmartErrorGroups({ appId: 'test-app', threshold: 0.8, limit: 100 })

            expect(result.mergedGroups).toBeLessThanOrEqual(result.originalGroups)
        })

        it('should handle empty error list', async () => {
            mockClickhouseClient.query.mockResolvedValueOnce({
                json: vi.fn().mockResolvedValue({ data: [] }),
            })

            const result = await service.getSmartErrorGroups({ appId: 'test-app' })

            expect(result.data).toEqual([])
            expect(result.total).toBe(0)
            expect(result.originalGroups).toBe(0)
            expect(result.mergedGroups).toBe(0)
        })

        it('should work without Redis (degraded mode)', async () => {
            mockRedis.status = 'disconnected'

            const result = await service.getSmartErrorGroups({ appId: 'test-app' })

            expect(result).toBeDefined()
            expect(result.data).toBeDefined()
        })
    })

    describe('getAggregationHistory', () => {
        it('should query aggregation history from ClickHouse', async () => {
            const mockHistory = [
                {
                    timestamp: '2024-01-01',
                    threshold: 0.8,
                    original_groups: 100,
                    merged_groups: 60,
                    reduction_rate: 40,
                    aggregation_data: JSON.stringify([]),
                },
            ]

            mockClickhouseClient.query.mockResolvedValueOnce({
                json: vi.fn().mockResolvedValue({ data: mockHistory }),
            })

            const result = await service.getAggregationHistory({ appId: 'test-app', limit: 100 })

            expect(result.data).toHaveLength(1)
            expect(result.total).toBe(1)
            expect(result.data[0].aggregation_data).toEqual([])
        })

        it('should handle time range filters', async () => {
            await service.getAggregationHistory({
                appId: 'test-app',
                startTime: '2024-01-01',
                endTime: '2024-01-31',
                limit: 50,
            })

            const query = mockClickhouseClient.query.mock.calls[0][0].query
            expect(query).toContain("timestamp >= '2024-01-01'")
            expect(query).toContain("timestamp <= '2024-01-31'")
        })
    })
})
