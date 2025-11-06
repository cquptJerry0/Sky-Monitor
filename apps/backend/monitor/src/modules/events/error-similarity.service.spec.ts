import { describe, it, expect, beforeEach } from 'vitest'

import { ErrorSimilarityService } from './error-similarity.service'

/**
 * 错误相似度计算服务单元测试
 *
 * @description
 * 测试覆盖：
 * 1. 相似度计算的准确性
 * 2. 边界情况处理
 * 3. 归一化逻辑
 * 4. 批量操作性能
 */
describe('ErrorSimilarityService', () => {
    let service: ErrorSimilarityService

    beforeEach(() => {
        service = new ErrorSimilarityService()
    })

    describe('calculateSimilarity', () => {
        it('should return 1.0 for identical messages', () => {
            const msg = 'Cannot read property "name" of undefined'
            const similarity = service.calculateSimilarity(msg, msg)
            expect(similarity).toBe(1.0)
        })

        it('should return 0.0 for completely different messages', () => {
            const msg1 = 'TypeError: Cannot read property of undefined'
            const msg2 = 'Network request failed'
            const similarity = service.calculateSimilarity(msg1, msg2)
            expect(similarity).toBeLessThan(0.5)
        })

        it('should return high similarity for messages differing only in numbers', () => {
            const msg1 = 'Error at line 123 in file.js'
            const msg2 = 'Error at line 456 in file.js'
            const similarity = service.calculateSimilarity(msg1, msg2)
            expect(similarity).toBeGreaterThan(0.9)
        })

        it('should return high similarity for messages differing only in property names', () => {
            const msg1 = 'Cannot read property "name" of undefined'
            const msg2 = 'Cannot read property "age" of undefined'
            const similarity = service.calculateSimilarity(msg1, msg2)
            expect(similarity).toBeGreaterThan(0.8)
        })

        it('should return high similarity for messages differing only in URLs', () => {
            const msg1 = 'Failed to fetch https://api.example.com/users'
            const msg2 = 'Failed to fetch https://api.example.com/posts'
            const similarity = service.calculateSimilarity(msg1, msg2)
            expect(similarity).toBeGreaterThan(0.8)
        })

        it('should handle empty messages', () => {
            const similarity = service.calculateSimilarity('', 'some error')
            expect(similarity).toBe(0)
        })

        it('should handle null/undefined messages', () => {
            const similarity = service.calculateSimilarity(null as any, 'some error')
            expect(similarity).toBe(0)
        })
    })

    describe('isSimilar', () => {
        it('should return true for similar messages with default threshold', () => {
            const msg1 = 'TypeError: Cannot read property "x" of undefined'
            const msg2 = 'TypeError: Cannot read property "y" of undefined'
            const result = service.isSimilar(msg1, msg2)
            expect(result).toBe(true)
        })

        it('should return false for dissimilar messages', () => {
            const msg1 = 'TypeError: Cannot read property of undefined'
            const msg2 = 'Network error occurred'
            const result = service.isSimilar(msg1, msg2)
            expect(result).toBe(false)
        })

        it('should respect custom threshold', () => {
            const msg1 = 'Error A occurred'
            const msg2 = 'Error B occurred'
            // 使用较低的阈值
            const result = service.isSimilar(msg1, msg2, 0.5)
            expect(result).toBe(true)
        })
    })

    describe('findMostSimilar', () => {
        it('should find the most similar message', () => {
            const target = 'TypeError: Cannot read property "name" of undefined'
            const candidates = [
                'Network error occurred',
                'TypeError: Cannot read property "age" of undefined', // 最相似
                'Syntax error in code',
            ]

            const result = service.findMostSimilar(target, candidates)

            expect(result).not.toBeNull()
            expect(result?.index).toBe(1)
            expect(result?.similarity).toBeGreaterThan(0.8)
        })

        it('should return null if no candidates meet threshold', () => {
            const target = 'TypeError: Cannot read property of undefined'
            const candidates = ['Network error', 'Timeout error', 'Parse error']

            const result = service.findMostSimilar(target, candidates, 0.9)

            expect(result).toBeNull()
        })

        it('should handle empty candidates array', () => {
            const target = 'Some error'
            const result = service.findMostSimilar(target, [])
            expect(result).toBeNull()
        })
    })

    describe('calculateSimilarityMatrix', () => {
        it('should create a symmetric matrix', () => {
            const messages = ['Error A', 'Error B', 'Error C']

            const matrix = service.calculateSimilarityMatrix(messages)

            // 检查对称性
            for (let i = 0; i < messages.length; i++) {
                for (let j = 0; j < messages.length; j++) {
                    expect(matrix[i][j]).toBe(matrix[j][i])
                }
            }
        })

        it('should have 1.0 on diagonal', () => {
            const messages = ['Error A', 'Error B', 'Error C']

            const matrix = service.calculateSimilarityMatrix(messages)

            // 对角线应该是 1.0
            for (let i = 0; i < messages.length; i++) {
                expect(matrix[i][i]).toBe(1.0)
            }
        })

        it('should handle empty array', () => {
            const matrix = service.calculateSimilarityMatrix([])
            expect(matrix).toEqual([])
        })
    })

    describe('normalization', () => {
        it('should normalize numbers correctly', () => {
            const msg1 = 'Error at line 123'
            const msg2 = 'Error at line 456'
            const similarity = service.calculateSimilarity(msg1, msg2)
            // 数字被归一化后，这两个消息应该完全相同
            expect(similarity).toBe(1.0)
        })

        it('should normalize URLs correctly', () => {
            const msg1 = 'Failed to fetch https://api.example.com/users/123'
            const msg2 = 'Failed to fetch https://api.another.com/posts/456'
            const similarity = service.calculateSimilarity(msg1, msg2)
            // URL 被归一化后，应该非常相似
            expect(similarity).toBeGreaterThan(0.8)
        })

        it('should normalize dates correctly', () => {
            const msg1 = 'Event occurred at 2024-01-01'
            const msg2 = 'Event occurred at 2024-12-31'
            const similarity = service.calculateSimilarity(msg1, msg2)
            // 日期被归一化后，应该完全相同
            expect(similarity).toBe(1.0)
        })

        it('should be case-insensitive', () => {
            const msg1 = 'TypeError: Cannot Read Property'
            const msg2 = 'typeerror: cannot read property'
            const similarity = service.calculateSimilarity(msg1, msg2)
            // 忽略大小写后，应该完全相同
            expect(similarity).toBe(1.0)
        })
    })

    describe('performance', () => {
        it('should handle large number of messages efficiently', () => {
            const messages = Array.from({ length: 100 }, (_, i) => `Error ${i}: Cannot read property`)

            const start = Date.now()
            const matrix = service.calculateSimilarityMatrix(messages)
            const duration = Date.now() - start

            expect(matrix.length).toBe(100)
            // 应该在合理时间内完成（< 1秒）
            expect(duration).toBeLessThan(1000)
        })
    })
})
