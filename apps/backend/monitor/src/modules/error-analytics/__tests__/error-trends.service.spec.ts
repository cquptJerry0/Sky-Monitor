import { Test, TestingModule } from '@nestjs/testing'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ErrorTrendsService } from '../services/error-trends.service'

describe('ErrorTrendsService', () => {
    let service: ErrorTrendsService
    let mockClickhouseClient: any
    let mockRedis: any

    beforeEach(async () => {
        // Mock ClickHouse Client (data returned from ClickHouse is DESC order, will be reversed in service)
        mockClickhouseClient = {
            query: vi.fn().mockResolvedValue({
                json: vi.fn().mockResolvedValue({
                    data: [
                        { time_bucket: '2024-01-01 12:00:00', count: 3, total_occurrences: 9, affected_users: 2, affected_sessions: 3 },
                        { time_bucket: '2024-01-01 11:00:00', count: 8, total_occurrences: 24, affected_users: 5, affected_sessions: 8 },
                        { time_bucket: '2024-01-01 10:00:00', count: 5, total_occurrences: 15, affected_users: 3, affected_sessions: 5 },
                    ],
                }),
            }),
        }

        // Mock Redis
        mockRedis = {
            status: 'ready',
            get: vi.fn().mockResolvedValue(null),
            setex: vi.fn().mockResolvedValue('OK'),
            lpush: vi.fn().mockResolvedValue(1),
            ltrim: vi.fn().mockResolvedValue('OK'),
            lrange: vi.fn().mockResolvedValue([]),
            connect: vi.fn().mockResolvedValue(undefined),
        }

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ErrorTrendsService,
                {
                    provide: 'CLICKHOUSE_CLIENT',
                    useValue: mockClickhouseClient,
                },
            ],
        }).compile()

        service = module.get<ErrorTrendsService>(ErrorTrendsService)

        // Replace Redis instance
        ;(service as any).redis = mockRedis
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('getErrorTrends', () => {
        it('should return error trends with hour window', async () => {
            const result = await service.getErrorTrends({
                appId: 'test-app',
                window: 'hour',
                limit: 100,
            })

            expect(result.data).toHaveLength(3)
            expect(result.window).toBe('hour')
            expect(result.stats).toBeDefined()
            expect(result.stats.totalCount).toBe(16)
            expect(result.stats.totalOccurrences).toBe(48)
        })

        it('should filter by fingerprint when provided', async () => {
            await service.getErrorTrends({
                appId: 'test-app',
                fingerprint: 'test-fingerprint',
                window: 'day',
            })

            const query = mockClickhouseClient.query.mock.calls[0][0].query
            expect(query).toContain("error_fingerprint = 'test-fingerprint'")
        })

        it('should support different time windows', async () => {
            await service.getErrorTrends({ appId: 'test-app', window: 'day' })
            expect(mockClickhouseClient.query.mock.calls[0][0].query).toContain('toStartOfDay')

            await service.getErrorTrends({ appId: 'test-app', window: 'week' })
            expect(mockClickhouseClient.query.mock.calls[1][0].query).toContain('toMonday')
        })

        it('should reverse data for chronological order', async () => {
            const result = await service.getErrorTrends({ appId: 'test-app', window: 'hour' })

            // Data should be from oldest to newest
            expect(result.data[0].time_bucket).toBe('2024-01-01 10:00:00')
            expect(result.data[2].time_bucket).toBe('2024-01-01 12:00:00')
        })
    })

    describe('compareErrorTrends', () => {
        it('should compare trends of multiple fingerprints', async () => {
            const result = await service.compareErrorTrends({
                appId: 'test-app',
                fingerprints: ['fp1', 'fp2'],
                window: 'hour',
            })

            expect(result.data).toBeDefined()
            expect(result.fingerprints).toEqual(['fp1', 'fp2'])
            expect(result.window).toBe('hour')
            expect(result.individualStats).toHaveLength(2)
        })

        it('should reject more than 10 fingerprints', async () => {
            const manyFingerprints = Array.from({ length: 11 }, (_, i) => `fp${i}`)

            await expect(
                service.compareErrorTrends({
                    appId: 'test-app',
                    fingerprints: manyFingerprints,
                    window: 'hour',
                })
            ).rejects.toThrow('Maximum 10 fingerprints allowed')
        })

        it('should merge time buckets from all fingerprints', async () => {
            const result = await service.compareErrorTrends({
                appId: 'test-app',
                fingerprints: ['fp1', 'fp2', 'fp3'],
                window: 'hour',
            })

            expect(result.data.length).toBeGreaterThan(0)
            result.data.forEach(dataPoint => {
                expect(dataPoint).toHaveProperty('time_bucket')
                expect(dataPoint).toHaveProperty('error_1')
                expect(dataPoint).toHaveProperty('error_2')
                expect(dataPoint).toHaveProperty('error_3')
            })
        })
    })

    describe('detectErrorSpikes', () => {
        it('should detect error spikes using statistical analysis', async () => {
            mockClickhouseClient.query.mockResolvedValueOnce({
                json: vi.fn().mockResolvedValue({
                    data: [
                        { error_count: '150' }, // Current (spike)
                        { error_count: '50' }, // Historical
                        { error_count: '45' },
                        { error_count: '55' },
                        { error_count: '48' },
                    ],
                }),
            })

            const result = await service.detectErrorSpikes({ appId: 'test-app', window: 'hour' })

            expect(result.is_spike).toBe(true)
            if ('current_count' in result) {
                expect(result.current_count).toBe(150)
                expect(result.baseline_avg).toBeGreaterThan(0)
                expect(result.spike_multiplier).toBeGreaterThan(1)
            }
        })

        it('should not detect spike for normal data', async () => {
            mockClickhouseClient.query.mockResolvedValueOnce({
                json: vi.fn().mockResolvedValue({
                    data: [
                        { error_count: '55' }, // Current (normal)
                        { error_count: '50' },
                        { error_count: '45' },
                        { error_count: '52' },
                        { error_count: '48' },
                    ],
                }),
            })

            const result = await service.detectErrorSpikes({ appId: 'test-app' })

            expect(result.is_spike).toBe(false)
        })

        it('should handle insufficient data', async () => {
            mockClickhouseClient.query.mockResolvedValueOnce({
                json: vi.fn().mockResolvedValue({
                    data: [{ error_count: '10' }, { error_count: '12' }],
                }),
            })

            const result = await service.detectErrorSpikes({ appId: 'test-app' })

            expect(result.is_spike).toBe(false)
            if ('message' in result) {
                expect(result.message).toContain('Insufficient data')
            }
        })

        it('should store spike alerts in Redis', async () => {
            mockClickhouseClient.query.mockResolvedValueOnce({
                json: vi.fn().mockResolvedValue({
                    data: [{ error_count: '200' }, { error_count: '50' }, { error_count: '45' }, { error_count: '55' }],
                }),
            })

            await service.detectErrorSpikes({ appId: 'test-app' })

            expect(mockRedis.setex).toHaveBeenCalled()
            expect(mockRedis.lpush).toHaveBeenCalled()
            expect(mockRedis.ltrim).toHaveBeenCalled()
        })
    })

    describe('getRecentSpikes', () => {
        it('should retrieve recent spikes from Redis', async () => {
            const mockSpikes = [
                {
                    app_id: 'test-app',
                    current_count: 150,
                    baseline_avg: 50,
                    is_spike: true,
                    spike_multiplier: 3.0,
                },
            ]

            mockRedis.lrange.mockResolvedValueOnce(['spike_key_1'])
            mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockSpikes[0]))

            const result = await service.getRecentSpikes('test-app', 10)

            expect(result.spikes).toHaveLength(1)
            expect(result.spikes[0].spike_multiplier).toBe(3.0)
            expect(result.total).toBe(1)
        })

        it('should handle Redis unavailable', async () => {
            mockRedis.status = 'disconnected'

            const result = await service.getRecentSpikes('test-app')

            expect(result.spikes).toEqual([])
            expect(result.message).toContain('Redis not available')
        })
    })

    describe('getTimeWindowFunction', () => {
        it('should return correct ClickHouse function for each window', () => {
            expect(service.getTimeWindowFunction('hour')).toBe('toStartOfHour')
            expect(service.getTimeWindowFunction('day')).toBe('toStartOfDay')
            expect(service.getTimeWindowFunction('week')).toBe('toMonday')
        })
    })
})
