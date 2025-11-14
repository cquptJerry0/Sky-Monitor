/**
 * ClickHouse 数据库迁移脚本
 * 用于执行 SQL 迁移文件
 */

import { createClient } from '@clickhouse/client'
import * as fs from 'fs'
import * as path from 'path'

// 从环境变量读取配置
const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL || 'http://localhost:8123'
const CLICKHOUSE_USERNAME = process.env.CLICKHOUSE_USERNAME || 'default'
const CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD || 'skyClickhouse2024'

async function runMigration(migrationFile: string) {
    console.log(`Running migration: ${migrationFile}`)

    // 创建 ClickHouse 客户端
    const client = createClient({
        url: CLICKHOUSE_URL,
        username: CLICKHOUSE_USERNAME,
        password: CLICKHOUSE_PASSWORD,
    })

    try {
        // 读取 SQL 文件
        const sqlPath = path.join(process.cwd(), 'sql', 'migrations', migrationFile)
        const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

        // 分割 SQL 语句 (按 ; 分割,忽略注释)
        const statements = sqlContent
            .split('\n')
            .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
            .join('\n')
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0)

        console.log(`Found ${statements.length} SQL statements`)

        // 执行每个语句
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i]
            console.log(`\nExecuting statement ${i + 1}/${statements.length}:`)
            console.log(statement.substring(0, 100) + '...')

            try {
                await client.query({ query: statement })
                console.log('✓ Success')
            } catch (error: any) {
                // 如果是 "column already exists" 错误,忽略
                if (error.message.includes('already exists') || error.message.includes('Duplicate column')) {
                    console.log('⚠ Column already exists, skipping')
                } else {
                    console.error('✗ Error:', error.message)
                    throw error
                }
            }
        }

        console.log('\n✓ Migration completed successfully')
    } catch (error: any) {
        console.error('\n✗ Migration failed:', error.message)
        throw error
    } finally {
        await client.close()
    }
}

// 主函数
async function main() {
    const migrationFile = process.argv[2]

    if (!migrationFile) {
        console.error('Usage: ts-node scripts/run-migration.ts <migration-file>')
        console.error('Example: ts-node scripts/run-migration.ts 001_add_sdk_features.sql')
        process.exit(1)
    }

    try {
        await runMigration(migrationFile)
        process.exit(0)
    } catch (error) {
        process.exit(1)
    }
}

main()
