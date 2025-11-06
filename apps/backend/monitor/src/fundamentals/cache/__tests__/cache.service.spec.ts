import { Test, TestingModule } from '@nestjs/testing'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CacheService } from '../cache.service'

describe('CacheService', () => {
    let service: CacheService
    let mockRedis: any

    beforeEach(async () => {
        // Mock Redis instance
        mockRedis = {
            status: 'ready',
            get: vi.fn().mockResolvedValue('test-value'),
            set: vi.fn().mockResolvedValue('OK'),
            setex: vi.fn().mockResolvedValue('OK'),
            del: vi.fn().mockResolvedValue(1),
            exists: vi.fn().mockResolvedValue(1),
            lpush: vi.fn().mockResolvedValue(1),
            lrange: vi.fn().mockResolvedValue(['value1', 'value2']),
            ltrim: vi.fn().mockResolvedValue('OK'),
            connect: vi.fn().mockResolvedValue(undefined),
        }

        const module: TestingModule = await Test.createTestingModule({
            providers: [CacheService],
        }).compile()

        service = module.get<CacheService>(CacheService)

        // Replace Redis instance with mock
        ;(service as any).redis = mockRedis
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('isReady', () => {
        it('should return true when Redis is ready', () => {
            expect(service.isReady()).toBe(true)
        })

        it('should return false when Redis is not ready', () => {
            mockRedis.status = 'disconnected'
            expect(service.isReady()).toBe(false)
        })
    })

    describe('get', () => {
        it('should get value from Redis', async () => {
            const result = await service.get('test-key')
            expect(result).toBe('test-value')
            expect(mockRedis.get).toHaveBeenCalledWith('test-key')
        })

        it('should return null when Redis is not ready', async () => {
            mockRedis.status = 'disconnected'
            const result = await service.get('test-key')
            expect(result).toBeNull()
        })

        it('should return null on error', async () => {
            mockRedis.get.mockRejectedValueOnce(new Error('Redis error'))
            const result = await service.get('test-key')
            expect(result).toBeNull()
        })
    })

    describe('set', () => {
        it('should set value in Redis', async () => {
            await service.set('test-key', 'test-value')
            expect(mockRedis.set).toHaveBeenCalledWith('test-key', 'test-value')
        })

        it('should not throw when Redis is not ready', async () => {
            mockRedis.status = 'disconnected'
            await expect(service.set('test-key', 'value')).resolves.not.toThrow()
        })

        it('should handle errors gracefully', async () => {
            mockRedis.set.mockRejectedValueOnce(new Error('Redis error'))
            await expect(service.set('test-key', 'value')).resolves.not.toThrow()
        })
    })

    describe('setex', () => {
        it('should set value with expiration', async () => {
            await service.setex('test-key', 300, 'test-value')
            expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 300, 'test-value')
        })

        it('should not throw when Redis is not ready', async () => {
            mockRedis.status = 'disconnected'
            await expect(service.setex('test-key', 300, 'value')).resolves.not.toThrow()
        })

        it('should handle errors gracefully', async () => {
            mockRedis.setex.mockRejectedValueOnce(new Error('Redis error'))
            await expect(service.setex('test-key', 300, 'value')).resolves.not.toThrow()
        })
    })

    describe('del', () => {
        it('should delete key from Redis', async () => {
            await service.del('test-key')
            expect(mockRedis.del).toHaveBeenCalledWith('test-key')
        })

        it('should not throw when Redis is not ready', async () => {
            mockRedis.status = 'disconnected'
            await expect(service.del('test-key')).resolves.not.toThrow()
        })
    })

    describe('exists', () => {
        it('should check if key exists', async () => {
            const result = await service.exists('test-key')
            expect(result).toBe(true)
            expect(mockRedis.exists).toHaveBeenCalledWith('test-key')
        })

        it('should return false when key does not exist', async () => {
            mockRedis.exists.mockResolvedValueOnce(0)
            const result = await service.exists('non-existent-key')
            expect(result).toBe(false)
        })

        it('should return false when Redis is not ready', async () => {
            mockRedis.status = 'disconnected'
            const result = await service.exists('test-key')
            expect(result).toBe(false)
        })
    })

    describe('lpush', () => {
        it('should push value to list', async () => {
            await service.lpush('test-list', 'value')
            expect(mockRedis.lpush).toHaveBeenCalledWith('test-list', 'value')
        })

        it('should not throw when Redis is not ready', async () => {
            mockRedis.status = 'disconnected'
            await expect(service.lpush('test-list', 'value')).resolves.not.toThrow()
        })
    })

    describe('lrange', () => {
        it('should get range from list', async () => {
            const result = await service.lrange('test-list', 0, 10)
            expect(result).toEqual(['value1', 'value2'])
            expect(mockRedis.lrange).toHaveBeenCalledWith('test-list', 0, 10)
        })

        it('should return empty array when Redis is not ready', async () => {
            mockRedis.status = 'disconnected'
            const result = await service.lrange('test-list', 0, 10)
            expect(result).toEqual([])
        })

        it('should return empty array on error', async () => {
            mockRedis.lrange.mockRejectedValueOnce(new Error('Redis error'))
            const result = await service.lrange('test-list', 0, 10)
            expect(result).toEqual([])
        })
    })

    describe('ltrim', () => {
        it('should trim list', async () => {
            await service.ltrim('test-list', 0, 99)
            expect(mockRedis.ltrim).toHaveBeenCalledWith('test-list', 0, 99)
        })

        it('should not throw when Redis is not ready', async () => {
            mockRedis.status = 'disconnected'
            await expect(service.ltrim('test-list', 0, 99)).resolves.not.toThrow()
        })
    })

    describe('getClient', () => {
        it('should return Redis client instance', () => {
            const client = service.getClient()
            expect(client).toBe(mockRedis)
        })
    })
})
