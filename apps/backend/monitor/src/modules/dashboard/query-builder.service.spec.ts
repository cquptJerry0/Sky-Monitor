import { BadRequestException } from '@nestjs/common'
import { describe, it, expect, beforeEach } from 'vitest'

import { QueryBuilderService } from './query-builder.service'
import type { QueryConfig } from '../../entities/dashboard-widget.entity'

describe('QueryBuilderService', () => {
    let service: QueryBuilderService

    beforeEach(() => {
        service = new QueryBuilderService()
    })

    const timeRange = {
        start: new Date('2025-01-01T00:00:00Z'),
        end: new Date('2025-01-01T23:59:59Z'),
    }

    describe('buildQuery', () => {
        it('应该构建基本查询', () => {
            const query: QueryConfig = {
                id: 'test',
                fields: ['count()'],
                conditions: [],
            }

            const sql = service.buildQuery(query, timeRange)

            expect(sql).toContain('SELECT count()')
            expect(sql).toContain('FROM monitor_events')
            expect(sql).toContain("WHERE timestamp >= '2025-01-01 00:00:00'")
            expect(sql).toContain("AND timestamp <= '2025-01-01 23:59:59'")
        })

        it('应该支持单个 appId', () => {
            const query: QueryConfig = {
                id: 'test',
                fields: ['count()'],
                conditions: [],
            }

            const sql = service.buildQuery(query, timeRange, 'app123')

            expect(sql).toContain("app_id = 'app123'")
        })

        it('应该支持多个 appId 使用 IN 操作符', () => {
            const query: QueryConfig = {
                id: 'test',
                fields: ['count()'],
                conditions: [],
            }

            const sql = service.buildQuery(query, timeRange, ['app123', 'app456', 'app789'])

            expect(sql).toContain("app_id IN ('app123', 'app456', 'app789')")
            expect(sql).not.toContain("app_id = 'app123' AND app_id = 'app456'")
        })

        it('应该支持单个元素的数组使用等号', () => {
            const query: QueryConfig = {
                id: 'test',
                fields: ['count()'],
                conditions: [],
            }

            const sql = service.buildQuery(query, timeRange, ['app123'])

            expect(sql).toContain("app_id = 'app123'")
            expect(sql).not.toContain('IN')
        })

        it('应该支持空数组不添加 appId 条件', () => {
            const query: QueryConfig = {
                id: 'test',
                fields: ['count()'],
                conditions: [],
            }

            const sql = service.buildQuery(query, timeRange, [])

            expect(sql).not.toContain('app_id')
        })

        it('应该转义 appId 中的单引号', () => {
            const query: QueryConfig = {
                id: 'test',
                fields: ['count()'],
                conditions: [],
            }

            const sql = service.buildQuery(query, timeRange, ["app'123"])

            expect(sql).toContain("app_id = 'app''123'")
        })

        it('应该支持 GROUP BY', () => {
            const query: QueryConfig = {
                id: 'test',
                fields: ['count()', 'event_type'],
                conditions: [],
                groupBy: ['event_type'],
            }

            const sql = service.buildQuery(query, timeRange)

            expect(sql).toContain('GROUP BY event_type')
        })

        it('应该支持 ORDER BY', () => {
            const query: QueryConfig = {
                id: 'test',
                fields: ['count()'],
                conditions: [],
                orderBy: [{ field: 'count()', direction: 'DESC' }],
            }

            const sql = service.buildQuery(query, timeRange)

            expect(sql).toContain('ORDER BY count() DESC')
        })

        it('应该拒绝空字段', () => {
            const query: QueryConfig = {
                id: 'test',
                fields: [],
                conditions: [],
            }

            expect(() => service.buildQuery(query, timeRange)).toThrow(BadRequestException)
        })

        it('应该拒绝非法字段名', () => {
            const query: QueryConfig = {
                id: 'test',
                fields: ['count(); DROP TABLE monitor_events;'],
                conditions: [],
            }

            expect(() => service.buildQuery(query, timeRange)).toThrow(BadRequestException)
        })
    })
})
