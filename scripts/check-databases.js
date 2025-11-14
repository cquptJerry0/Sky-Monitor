/**
 * 检查 ClickHouse 数据库和表
 */

const { createClient } = require('@clickhouse/client')

const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL || 'http://localhost:8123'
const CLICKHOUSE_USERNAME = process.env.CLICKHOUSE_USERNAME || 'default'
const CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD || 'skyClickhouse2024'

async function checkDatabases() {
    const client = createClient({
        url: CLICKHOUSE_URL,
        username: CLICKHOUSE_USERNAME,
        password: CLICKHOUSE_PASSWORD,
    })

    try {
        // 查看所有数据库
        console.log('=== ClickHouse 数据库列表 ===\n')
        const dbResult = await client.query({ query: 'SHOW DATABASES' })
        const dbData = await dbResult.json()
        dbData.data.forEach(db => {
            console.log(`- ${db.name}`)
        })

        // 查看当前数据库
        console.log('\n=== 当前数据库 ===\n')
        const currentDbResult = await client.query({ query: 'SELECT currentDatabase() as db' })
        const currentDbData = await currentDbResult.json()
        console.log(`当前数据库: ${currentDbData.data[0].db}`)

        // 查看 monitor_events 表在哪个数据库
        console.log('\n=== monitor_events 表位置 ===\n')
        const tableResult = await client.query({
            query: `
                SELECT database, name, engine
                FROM system.tables
                WHERE name = 'monitor_events'
            `,
        })
        const tableData = await tableResult.json()
        if (tableData.data.length > 0) {
            tableData.data.forEach(table => {
                console.log(`数据库: ${table.database}, 表: ${table.name}, 引擎: ${table.engine}`)
            })
        } else {
            console.log('未找到 monitor_events 表')
        }

        // 查看 default 数据库中的 monitor_events 表字段
        console.log('\n=== default.monitor_events 表字段 ===\n')
        const columnsResult = await client.query({
            query: `
                SELECT name, type
                FROM system.columns
                WHERE database = 'default' AND table = 'monitor_events'
                AND name LIKE '%session%'
                ORDER BY name
            `,
        })
        const columnsData = await columnsResult.json()
        if (columnsData.data.length > 0) {
            console.log('Session 相关字段:')
            columnsData.data.forEach(col => {
                console.log(`  - ${col.name.padEnd(25)} ${col.type}`)
            })
        } else {
            console.log('未找到 session 相关字段')
        }
    } catch (error) {
        console.error('检查失败:', error.message)
        throw error
    } finally {
        await client.close()
    }
}

checkDatabases()
