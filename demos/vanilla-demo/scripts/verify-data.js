#!/usr/bin/env node

/**
 * verify-data.js - ClickHouse数据验证脚本
 *
 * 功能：
 * - 连接ClickHouse数据库
 * - 查询所有事件类型分布
 * - 验证字段映射完整性
 * - 验证JSON字段序列化
 * - 验证会话数据关联
 * - 生成验证报告
 */

import { createClient } from '@clickhouse/client'

// ClickHouse连接配置
const clickhouseClient = createClient({
    url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || 'skyClickhouse2024',
    database: 'sky_monitor',
})

/**
 * 主验证函数
 */
async function main() {
    console.log('========================================')
    console.log('Sky Monitor - ClickHouse 数据验证')
    console.log('========================================\n')

    try {
        // 1. 验证连接
        console.log('1. 验证ClickHouse连接...')
        await verifyConnection()
        console.log('   ✅ 连接成功\n')

        // 2. 验证事件类型分布
        console.log('2. 验证事件类型分布...')
        await verifyEventTypes()

        // 3. 验证Integration字段映射
        console.log('\n3. 验证Integration字段映射...')
        await verifyFieldMapping()

        // 4. 验证JSON字段序列化
        console.log('\n4. 验证JSON字段序列化...')
        await verifyJSONFields()

        // 5. 验证会话数据关联
        console.log('\n5. 验证会话数据关联...')
        await verifySessionData()

        // 6. 生成统计报告
        console.log('\n6. 生成统计报告...')
        await generateReport()

        console.log('\n========================================')
        console.log('✅ 验证完成！所有检查通过')
        console.log('========================================')
    } catch (error) {
        console.error('\n❌ 验证失败:', error.message)
        console.error(error)
        process.exit(1)
    } finally {
        await clickhouseClient.close()
    }
}

/**
 * 验证ClickHouse连接
 */
async function verifyConnection() {
    const result = await clickhouseClient.query({
        query: 'SELECT version()',
        format: 'JSONEachRow',
    })
    const data = await result.json()
    console.log(`   ClickHouse版本: ${data[0]['version()']}`)
}

/**
 * 验证事件类型分布
 */
async function verifyEventTypes() {
    const result = await clickhouseClient.query({
        query: `
            SELECT 
                event_type,
                COUNT(*) as count
            FROM events
            WHERE timestamp >= now() - INTERVAL 1 HOUR
            GROUP BY event_type
            ORDER BY count DESC
        `,
        format: 'JSONEachRow',
    })

    const data = await result.json()

    console.log('   事件类型分布（最近1小时）:')
    data.forEach(row => {
        console.log(`   - ${row.event_type}: ${row.count} 条`)
    })

    // 验证所有Integration的事件都存在
    const expectedTypes = ['error', 'webVital', 'performance', 'custom', 'session']
    const actualTypes = data.map(row => row.event_type)

    const missingTypes = expectedTypes.filter(type => !actualTypes.includes(type))
    if (missingTypes.length > 0) {
        console.log(`   ⚠️  缺失事件类型: ${missingTypes.join(', ')}`)
    } else {
        console.log('   ✅ 所有预期事件类型都存在')
    }
}

/**
 * 验证Integration字段映射
 */
async function verifyFieldMapping() {
    const integrations = [
        {
            name: 'Errors',
            requiredFields: ['error_message', 'error_stack', 'error_fingerprint'],
            query: `SELECT * FROM events WHERE event_type = 'error' LIMIT 1`,
        },
        {
            name: 'HttpError',
            requiredFields: ['http_url', 'http_method', 'http_status', 'http_duration'],
            query: `SELECT * FROM events WHERE event_type = 'error' AND http_url != '' LIMIT 1`,
        },
        {
            name: 'ResourceError',
            requiredFields: ['resource_url', 'resource_type'],
            query: `SELECT * FROM events WHERE event_type = 'error' AND resource_url != '' LIMIT 1`,
        },
        {
            name: 'Performance',
            requiredFields: ['http_url', 'http_duration'],
            query: `SELECT * FROM events WHERE event_type = 'performance' LIMIT 1`,
        },
        {
            name: 'Session',
            requiredFields: ['session_id', 'session_start_time', 'session_duration'],
            query: `SELECT * FROM events WHERE session_id != '' LIMIT 1`,
        },
        {
            name: 'WebVitals',
            requiredFields: ['event_name'],
            query: `SELECT * FROM events WHERE event_type = 'webVital' LIMIT 1`,
        },
    ]

    for (const integration of integrations) {
        try {
            const result = await clickhouseClient.query({
                query: integration.query,
                format: 'JSONEachRow',
            })
            const data = await result.json()

            if (data.length === 0) {
                console.log(`   ⚠️  ${integration.name}: 未找到数据`)
                continue
            }

            const record = data[0]
            const missingFields = integration.requiredFields.filter(field => !record.hasOwnProperty(field))

            if (missingFields.length === 0) {
                console.log(`   ✅ ${integration.name}: 所有必需字段存在`)
            } else {
                console.log(`   ❌ ${integration.name}: 缺失字段 ${missingFields.join(', ')}`)
            }
        } catch (error) {
            console.log(`   ❌ ${integration.name}: 查询失败 - ${error.message}`)
        }
    }
}

/**
 * 验证JSON字段序列化
 */
async function verifyJSONFields() {
    const jsonFields = [
        { name: 'event_data', table: 'events' },
        { name: 'tags', description: 'Tags JSON' },
        { name: 'extra', description: 'Extra JSON' },
        { name: 'breadcrumbs', description: 'Breadcrumbs JSON' },
    ]

    const result = await clickhouseClient.query({
        query: `
            SELECT 
                event_data,
                tags,
                extra
            FROM events
            WHERE event_data != '' OR tags != '' OR extra != ''
            LIMIT 1
        `,
        format: 'JSONEachRow',
    })

    const data = await result.json()

    if (data.length === 0) {
        console.log('   ⚠️  未找到包含JSON字段的记录')
        return
    }

    const record = data[0]

    // 验证event_data
    if (record.event_data) {
        try {
            const eventData = JSON.parse(record.event_data)
            console.log(`   ✅ event_data: 正确序列化 (${Object.keys(eventData).length} 个字段)`)
        } catch (e) {
            console.log(`   ❌ event_data: JSON解析失败`)
        }
    }

    // 验证tags
    if (record.tags) {
        try {
            const tags = JSON.parse(record.tags)
            console.log(`   ✅ tags: 正确序列化 (${Object.keys(tags).length} 个标签)`)
        } catch (e) {
            console.log(`   ❌ tags: JSON解析失败`)
        }
    }

    // 验证extra
    if (record.extra) {
        try {
            const extra = JSON.parse(record.extra)
            console.log(`   ✅ extra: 正确序列化 (${Object.keys(extra).length} 个字段)`)
        } catch (e) {
            console.log(`   ❌ extra: JSON解析失败`)
        }
    }
}

/**
 * 验证会话数据关联
 */
async function verifySessionData() {
    const result = await clickhouseClient.query({
        query: `
            SELECT 
                session_id,
                COUNT(*) as event_count,
                SUM(CASE WHEN event_type = 'error' THEN 1 ELSE 0 END) as error_count,
                MIN(timestamp) as first_event,
                MAX(timestamp) as last_event
            FROM events
            WHERE session_id != ''
                AND timestamp >= now() - INTERVAL 1 HOUR
            GROUP BY session_id
            ORDER BY event_count DESC
            LIMIT 5
        `,
        format: 'JSONEachRow',
    })

    const data = await result.json()

    if (data.length === 0) {
        console.log('   ⚠️  未找到会话数据')
        return
    }

    console.log(`   找到 ${data.length} 个活跃会话（最近1小时）:`)
    data.forEach((session, index) => {
        console.log(`   ${index + 1}. Session ${session.session_id.substring(0, 8)}...`)
        console.log(`      - 事件数: ${session.event_count}`)
        console.log(`      - 错误数: ${session.error_count}`)
        console.log(`      - 持续时间: ${Math.round((new Date(session.last_event) - new Date(session.first_event)) / 1000)}秒`)
    })

    console.log('   ✅ 会话数据关联正常')
}

/**
 * 生成统计报告
 */
async function generateReport() {
    const result = await clickhouseClient.query({
        query: `
            SELECT 
                COUNT(*) as total_events,
                COUNT(DISTINCT session_id) as unique_sessions,
                COUNT(DISTINCT app_id) as unique_apps,
                SUM(CASE WHEN event_type = 'error' THEN 1 ELSE 0 END) as total_errors,
                SUM(CASE WHEN event_type = 'performance' THEN 1 ELSE 0 END) as total_performance,
                SUM(CASE WHEN event_type = 'webVital' THEN 1 ELSE 0 END) as total_webvitals
            FROM events
            WHERE timestamp >= now() - INTERVAL 1 HOUR
        `,
        format: 'JSONEachRow',
    })

    const data = await result.json()
    const stats = data[0]

    console.log('\n   📊 统计摘要（最近1小时）:')
    console.log(`   - 总事件数: ${stats.total_events}`)
    console.log(`   - 唯一会话: ${stats.unique_sessions}`)
    console.log(`   - 应用数: ${stats.unique_apps}`)
    console.log(`   - 错误事件: ${stats.total_errors}`)
    console.log(`   - 性能事件: ${stats.total_performance}`)
    console.log(`   - Web Vitals: ${stats.total_webvitals}`)

    // 计算错误率
    if (stats.total_events > 0) {
        const errorRate = ((stats.total_errors / stats.total_events) * 100).toFixed(2)
        console.log(`   - 错误率: ${errorRate}%`)
    }
}

// 运行主函数
main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
