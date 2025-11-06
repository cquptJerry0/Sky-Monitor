import { createClient, ClickHouseClient } from '@clickhouse/client'
import axios from 'axios'

/**
 * DSN Server 测试环境准备脚本
 *
 * 职责：
 * 1. 检查 DSN Server 是否运行
 * 2. 检查 ClickHouse 数据库是否可用
 * 3. 检查 Redis 是否可用（Bull 队列需要）
 * 4. 清理测试数据
 */

const DSN_SERVER_URL = 'http://localhost:8080'
const MONITOR_SERVER_URL = 'http://localhost:8081'
const CLICKHOUSE_URL = 'http://localhost:8123'

/**
 * 检查服务状态
 */
async function checkServices() {
    console.log('1. 检查服务状态...')

    // 检查 DSN Server
    try {
        const response = await axios.get(`${DSN_SERVER_URL}/api/monitoring/health`, {
            timeout: 5000,
        })
        if (response.status === 200) {
            console.log('   ✓ DSN Server 运行中')
        } else {
            throw new Error(`DSN Server 返回异常状态: ${response.status}`)
        }
    } catch (error) {
        throw new Error(`❌ DSN Server 未运行: ${error.message}`)
    }

    // 检查 Monitor Server（用于创建测试应用）
    try {
        const response = await axios.get(`${MONITOR_SERVER_URL}/api/health`, {
            timeout: 5000,
        })
        if (response.status === 200) {
            console.log('   ✓ Monitor Server 运行中')
        } else {
            throw new Error(`Monitor Server 返回异常状态: ${response.status}`)
        }
    } catch (error) {
        console.warn('   ⚠ Monitor Server 未运行（无法创建测试应用）')
    }
}

/**
 * 检查数据库连接
 */
async function checkDatabases() {
    console.log('2. 检查数据库连接...')

    // 检查 ClickHouse
    try {
        const client = createClient({
            url: CLICKHOUSE_URL,
            username: 'default',
            password: 'skyClickhouse2024',
        })

        await client.query({
            query: 'SELECT 1',
            format: 'JSONEachRow',
        })

        await client.close()
        console.log('   ✓ ClickHouse 连接正常')
    } catch (error) {
        throw new Error(`❌ ClickHouse 连接失败: ${error.message}`)
    }

    // 检查 Redis（通过 DSN Server health 接口）
    try {
        const response = await axios.get(`${DSN_SERVER_URL}/api/monitoring/health/diagnostics`, {
            timeout: 5000,
        })
        if (response.data.success) {
            console.log('   ✓ Redis 连接正常（Bull 队列可用）')
        }
    } catch (error) {
        console.warn('   ⚠ 无法验证 Redis 状态')
    }
}

/**
 * 清理测试数据
 */
export async function cleanupTestData() {
    console.log('=== 清理测试数据 ===')

    try {
        const client = createClient({
            url: CLICKHOUSE_URL,
            username: 'default',
            password: 'skyClickhouse2024',
        })

        // 清理测试事件（删除所有包含 'test' 的事件）
        await client.command({
            query: `
                ALTER TABLE monitor_events 
                DELETE WHERE 
                    error_message LIKE '%test%' OR 
                    path LIKE '%test%' OR
                    user_email LIKE '%test%' OR
                    user_username LIKE '%test%'
            `,
        })

        await client.close()
        console.log('✓ 测试数据已清理')
    } catch (error) {
        console.warn(`⚠ 清理测试数据失败: ${error.message}`)
    }
}

/**
 * 主入口：准备测试环境
 */
export async function setupTestEnvironment() {
    console.log('=== 测试环境准备 ===')

    try {
        // 检查服务
        await checkServices()

        // 检查数据库
        await checkDatabases()

        console.log('=== 测试环境准备完成 ===\n')
    } catch (error) {
        console.error('\n✗ 测试环境准备失败:')
        throw error
    }
}

/**
 * 直接运行时执行环境检查
 */
if (require.main === module) {
    setupTestEnvironment()
        .then(() => {
            console.log('\n✓ 测试环境准备完成，可以运行测试了')
            process.exit(0)
        })
        .catch(error => {
            console.error(`\n${error.message}`)
            process.exit(1)
        })
}
