import { Injectable, BadRequestException } from '@nestjs/common'
import type { QueryConfig, QueryCondition } from '../../entities/dashboard-widget.entity'
import { CLICKHOUSE_SCHEMA, validateField, getFieldConfig } from '../../config/clickhouse-schema'

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

        const sanitizedFields = fields.map(field => this.sanitizeAndValidateField(field))
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
        const sanitizedField = this.sanitizeAndValidateField(field)

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

        const sanitizedFields = groupBy.map(field => this.sanitizeAndValidateGroupByField(field))
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
            const sanitizedField = this.sanitizeAndValidateField(order.field)
            const direction = order.direction === 'DESC' ? 'DESC' : 'ASC'
            return `${sanitizedField} ${direction}`
        })

        return `ORDER BY ${orderClauses.join(', ')}`
    }

    /**
     * 清理并验证字段名
     * 支持聚合函数和 ClickHouse 函数
     */
    private sanitizeAndValidateField(field: string): string {
        // 先进行基本的 SQL 注入防护
        if (!/^[a-zA-Z0-9_(),.\s*]+$/.test(field)) {
            throw new BadRequestException(`非法的字段名: ${field}`)
        }

        // 提取字段名 (去除聚合函数和别名)
        const extractedField = this.extractFieldName(field)

        // 如果是聚合函数或 ClickHouse 函数,直接返回
        if (this.isAggregateOrFunction(field)) {
            return field
        }

        // 验证字段是否存在于 Schema 中
        if (extractedField && !validateField(extractedField)) {
            throw new BadRequestException(`字段 "${extractedField}" 不存在于 ClickHouse Schema 中`)
        }

        return field
    }

    /**
     * 验证 GROUP BY 字段
     */
    private sanitizeAndValidateGroupByField(field: string): string {
        // 先进行基本验证
        const sanitized = this.sanitizeAndValidateField(field)

        // 提取字段名
        const extractedField = this.extractFieldName(field)

        // 如果是 ClickHouse 时间函数,允许
        if (this.isTimeFunction(field)) {
            return sanitized
        }

        // 验证字段是否可分组
        if (extractedField) {
            const fieldConfig = getFieldConfig(extractedField)
            if (fieldConfig && !fieldConfig.groupable) {
                throw new BadRequestException(`字段 "${extractedField}" 不支持 GROUP BY 操作`)
            }
        }

        return sanitized
    }

    /**
     * 提取字段名 (去除函数和别名)
     */
    private extractFieldName(field: string): string | null {
        // 去除空格
        const trimmed = field.trim()

        // 处理别名 (如 "count() as total")
        const withoutAlias = trimmed.split(/\s+as\s+/i)[0].trim()

        // 处理聚合函数 (如 "count(field)", "avg(field)")
        const functionMatch = withoutAlias.match(/^[a-zA-Z]+\(([^)]+)\)$/)
        if (functionMatch) {
            const innerField = functionMatch[1].trim()
            // 如果是 count(*) 或 count(DISTINCT field),返回 null
            if (innerField === '*' || innerField.startsWith('DISTINCT')) {
                return null
            }
            return innerField
        }

        // 处理 ClickHouse 时间函数 (如 "toStartOfHour(timestamp)")
        const timeMatch = withoutAlias.match(/^to[A-Z][a-zA-Z]+\(([^)]+)\)$/)
        if (timeMatch) {
            return timeMatch[1].trim()
        }

        // 普通字段
        return withoutAlias
    }

    /**
     * 判断是否为聚合函数或 ClickHouse 函数
     */
    private isAggregateOrFunction(field: string): boolean {
        const trimmed = field.trim().toLowerCase()
        const aggregateFunctions = ['count', 'sum', 'avg', 'min', 'max', 'uniq', 'grouparray']
        return aggregateFunctions.some(fn => trimmed.startsWith(fn + '('))
    }

    /**
     * 判断是否为 ClickHouse 时间函数
     */
    private isTimeFunction(field: string): boolean {
        const trimmed = field.trim().toLowerCase()
        const timeFunctions = ['tostartofminute', 'tostartofhour', 'tostartofday', 'tostartofweek', 'tostartofmonth']
        return timeFunctions.some(fn => trimmed.startsWith(fn + '('))
    }

    /**
     * 清理字段名,防止 SQL 注入 (保留用于向后兼容)
     * @deprecated 使用 sanitizeAndValidateField 替代
     */
    private sanitizeField(field: string): string {
        if (!/^[a-zA-Z0-9_(),.\s*]+$/.test(field)) {
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
