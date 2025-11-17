import { Injectable, BadRequestException } from '@nestjs/common'
import type { QueryConfig, QueryCondition } from '../../entities/dashboard-widget.entity'

/**
 * 查询构建器服务
 * 将 Query DSL 转换为 ClickHouse SQL
 */
@Injectable()
export class QueryBuilderService {
    /**
     * 构建 ClickHouse SQL 查询
     * @param query 查询配置
     * @param timeRange 时间范围 { start: Date, end: Date }
     * @param appId 应用 ID (可选,支持单个或多个)
     * @returns ClickHouse SQL 字符串
     */
    buildQuery(query: QueryConfig, timeRange: { start: Date; end: Date }, appId?: string | string[]): string {
        const selectClause = this.buildSelectClause(query.fields)
        const fromClause = 'FROM monitor_events'
        const whereClause = this.buildWhereClause(query.conditions, timeRange, appId)
        const groupByClause = this.buildGroupByClause(query.groupBy)
        const orderByClause = this.buildOrderByClause(query.orderBy)

        const sql = [selectClause, fromClause, whereClause, groupByClause, orderByClause].filter(Boolean).join('\n')

        return sql
    }

    /**
     * 构建 SELECT 子句
     */
    private buildSelectClause(fields: string[]): string {
        if (!fields || fields.length === 0) {
            throw new BadRequestException('fields 不能为空')
        }

        const sanitizedFields = fields.map(field => this.sanitizeField(field))
        return `SELECT ${sanitizedFields.join(', ')}`
    }

    /**
     * 构建 WHERE 子句
     */
    private buildWhereClause(
        conditions: QueryCondition[] | undefined,
        timeRange: { start: Date; end: Date },
        appId?: string | string[]
    ): string {
        const whereClauses: string[] = []

        // 时间范围条件 (必须)
        const startTime = this.formatTimestamp(timeRange.start)
        const endTime = this.formatTimestamp(timeRange.end)
        whereClauses.push(`timestamp >= '${startTime}'`)
        whereClauses.push(`timestamp <= '${endTime}'`)

        // 应用 ID 条件 (可选,支持单个或多个)
        if (appId) {
            if (Array.isArray(appId)) {
                if (appId.length === 1) {
                    whereClauses.push(`app_id = '${this.escapeString(appId[0])}'`)
                } else if (appId.length > 1) {
                    const appIdList = appId.map(id => `'${this.escapeString(id)}'`).join(', ')
                    whereClauses.push(`app_id IN (${appIdList})`)
                }
            } else {
                whereClauses.push(`app_id = '${this.escapeString(appId)}'`)
            }
        }

        // 用户自定义条件
        if (conditions && conditions.length > 0) {
            conditions.forEach(condition => {
                const clause = this.buildConditionClause(condition)
                if (clause) {
                    whereClauses.push(clause)
                }
            })
        }

        return whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
    }

    /**
     * 构建单个条件子句
     */
    private buildConditionClause(condition: QueryCondition): string {
        const { field, operator, value } = condition

        // 验证字段名
        const sanitizedField = this.sanitizeField(field)

        switch (operator) {
            case '=':
            case '!=':
            case '>':
            case '<':
            case '>=':
            case '<=':
                return `${sanitizedField} ${operator} '${this.escapeString(String(value))}'`

            case 'IN': {
                if (!Array.isArray(value)) {
                    throw new BadRequestException('IN 操作符的值必须是数组')
                }
                const inValues = value.map(v => `'${this.escapeString(String(v))}'`).join(', ')
                return `${sanitizedField} IN (${inValues})`
            }

            case 'LIKE':
                return `${sanitizedField} LIKE '%${this.escapeString(String(value))}%'`

            default:
                throw new BadRequestException(`不支持的操作符: ${operator}`)
        }
    }

    /**
     * 构建 GROUP BY 子句
     */
    private buildGroupByClause(groupBy: string[] | undefined): string {
        if (!groupBy || groupBy.length === 0) {
            return ''
        }

        const sanitizedFields = groupBy.map(field => this.sanitizeField(field))
        return `GROUP BY ${sanitizedFields.join(', ')}`
    }

    /**
     * 构建 ORDER BY 子句
     */
    private buildOrderByClause(orderBy: Array<{ field: string; direction: 'ASC' | 'DESC' }> | undefined): string {
        if (!orderBy || orderBy.length === 0) {
            return ''
        }

        const orderClauses = orderBy.map(order => {
            const sanitizedField = this.sanitizeField(order.field)
            const direction = order.direction === 'DESC' ? 'DESC' : 'ASC'
            return `${sanitizedField} ${direction}`
        })

        return `ORDER BY ${orderClauses.join(', ')}`
    }

    /**
     * 清理字段名,防止 SQL 注入
     */
    private sanitizeField(field: string): string {
        // 允许的字符: 字母、数字、下划线、括号、逗号、点
        // 用于支持函数调用如 count(), toStartOfHour(timestamp)
        if (!/^[a-zA-Z0-9_(),.\s]+$/.test(field)) {
            throw new BadRequestException(`非法的字段名: ${field}`)
        }
        return field
    }

    /**
     * 转义字符串,防止 SQL 注入
     */
    private escapeString(value: string): string {
        return value.replace(/'/g, "''")
    }

    /**
     * 格式化时间戳为 ClickHouse 格式
     */
    private formatTimestamp(date: Date): string {
        return date.toISOString().slice(0, 19).replace('T', ' ')
    }
}
