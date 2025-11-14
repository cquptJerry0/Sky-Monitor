/**
 * 验证 ClickHouse 表字段
 */

const { createClient } = require('@clickhouse/client')

const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL || 'http://localhost:8123'
const CLICKHOUSE_USERNAME = process.env.CLICKHOUSE_USERNAME || 'default'
const CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD || 'skyClickhouse2024'

async function verifyColumns() {
    const client = createClient({
        url: CLICKHOUSE_URL,
        username: CLICKHOUSE_USERNAME,
        password: CLICKHOUSE_PASSWORD,
    })

    try {
        const query = `
            SELECT name, type, comment 
            FROM system.columns 
            WHERE table = 'monitor_events' AND database = currentDatabase()
            AND name IN (
                'session_id', 'session_start_time', 'session_duration', 
                'session_event_count', 'session_error_count', 'session_page_views',
                'user_id', 'user_email', 'user_username', 'user_ip',
                'tags', 'extra', 'breadcrumbs', 'contexts',
                'event_level', 'environment',
                'perf_category', 'perf_value', 'perf_is_slow', 'perf_success', 'perf_metrics',
                'dedup_count', 'sampling_rate', 'sampling_sampled'
            )
            ORDER BY name
        `

        const result = await client.query({ query })
        const data = await result.json()

        console.log('\n=== ClickHouse monitor_events 表字段验证 ===\n')
        console.log(`找到 ${data.data.length} 个字段:\n`)

        data.data.forEach(col => {
            console.log(`✓ ${col.name.padEnd(25)} ${col.type.padEnd(15)} ${col.comment || ''}`)
        })

        console.log('\n验证完成!')
    } catch (error) {
        console.error('验证失败:', error.message)
        throw error
    } finally {
        await client.close()
    }
}

verifyColumns()
