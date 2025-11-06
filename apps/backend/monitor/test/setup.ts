import { createClient } from '@clickhouse/client'
import axios from 'axios'
import { execSync } from 'child_process'
import Redis from 'ioredis'

/**
 * 测试环境准备脚本
 * 在运行 e2e 测试前执行，确保测试环境完整
 */
export async function setupTestEnvironment() {
    console.log('=== 测试环境准备 ===')

    // 1. 检查服务是否运行
    console.log('1. 检查服务状态...')
    await checkServices()

    // 2. 检查数据库连接
    console.log('2. 检查数据库连接...')
    await checkDatabases()

    // 3. 清理黑名单（避免之前的测试影响）
    console.log('3. 清理认证黑名单...')
    await clearBlacklists()

    // 4. 确保测试用户存在
    console.log('4. 准备测试用户...')
    await ensureTestUser()

    // 5. 验证登录
    console.log('5. 验证登录功能...')
    await verifyLogin()

    console.log('=== 测试环境准备完成 ===\n')
}

/**
 * 检查必要的服务是否在运行
 */
async function checkServices() {
    const services = [
        { name: 'Monitor Server', url: 'http://localhost:8081/api/health' },
        { name: 'DSN Server', url: 'http://localhost:8080/api/monitoring/health' },
    ]

    for (const service of services) {
        try {
            await axios.get(service.url, { timeout: 3000 })
            console.log(`   ✓ ${service.name} 运行中`)
        } catch (error) {
            throw new Error(`❌ ${service.name} 未运行！请先启动: ${service.url}`)
        }
    }
}

/**
 * 清理 Redis 黑名单
 */
async function clearBlacklists() {
    try {
        const redis = new Redis({
            host: 'localhost',
            port: 6379,
            password: 'skyRedis2024',
            maxRetriesPerRequest: 1,
            retryStrategy: () => null,
        })

        const keys = await redis.keys('blacklist:*')
        if (keys.length > 0) {
            await redis.del(...keys)
            console.log(`   ✓ 清理了 ${keys.length} 个黑名单记录`)
        } else {
            console.log('   ✓ 黑名单为空')
        }

        await redis.quit()
    } catch (error) {
        console.log('   ⚠ 无法连接 Redis，跳过黑名单清理')
    }
}

/**
 * 检查数据库连接
 */
async function checkDatabases() {
    // 检查 ClickHouse
    try {
        const ch = createClient({
            url: 'http://localhost:8123',
            username: 'default',
            password: 'skyClickhouse2024',
        })
        await ch.query({ query: 'SELECT 1' })
        await ch.close()
        console.log('   ✓ ClickHouse 连接正常')
    } catch (error) {
        throw new Error(`❌ ClickHouse 连接失败: ${error.message}`)
    }

    // 检查 PostgreSQL（通过 Monitor Server API）
    try {
        const response = await axios.get('http://localhost:8081/api/health')
        // health 接口返回 200 说明服务正常，PostgreSQL 通过 TypeORM 间接验证
        if (response.status === 200) {
            console.log('   ✓ PostgreSQL 连接正常（通过 TypeORM）')
        } else {
            throw new Error(`Health 接口返回状态码: ${response.status}`)
        }
    } catch (error) {
        throw new Error(`❌ PostgreSQL 连接失败: ${error.message}`)
    }
}

/**
 * 确保测试用户存在
 */
async function ensureTestUser() {
    try {
        // 尝试注册测试用户（如果已存在会失败，但不影响）
        await axios.post('http://localhost:8081/api/admin/register', {
            username: 'test-user-e2e',
            password: 'Test@123456',
            email: 'e2e-test@skymonitor.com',
        })
        console.log('   ✓ 测试用户已创建')
    } catch (error) {
        if (error.response?.status === 409) {
            console.log('   ✓ 测试用户已存在')
        } else {
            console.log('   ⚠ 无法创建测试用户，将使用 admin 用户')
        }
    }
}

/**
 * 验证登录功能
 */
async function verifyLogin() {
    try {
        // 尝试用 admin 登录
        const response = await axios.post('http://localhost:8081/api/auth/login', {
            username: 'admin',
            password: 'admin123',
        })

        // 登录接口返回格式: { data: { access_token: "..." }, success: true }
        const token = response.data.data?.access_token || response.data.access_token

        if (token) {
            console.log('   ✓ 登录功能正常')
            return token
        } else {
            throw new Error('登录响应无 token')
        }
    } catch (error) {
        throw new Error(`❌ 登录失败: ${error.message}\n请确保 PostgreSQL 中存在 admin 用户`)
    }
}

/**
 * 清理测试数据
 */
export async function cleanupTestData() {
    console.log('\n=== 清理测试数据 ===')

    try {
        const ch = createClient({
            url: 'http://localhost:8123',
            username: 'default',
            password: 'skyClickhouse2024',
        })

        // 删除所有测试事件
        await ch.command({
            query: "ALTER TABLE monitor_events DELETE WHERE app_id LIKE 'test-app-%' OR user_id LIKE 'user-%' OR session_id LIKE 'session-%'",
        })

        await ch.close()
        console.log('✓ 测试数据已清理')
    } catch (error) {
        console.warn('⚠ 清理测试数据失败:', error.message)
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    setupTestEnvironment()
        .then(() => {
            console.log('\n✓ 测试环境准备完成，可以运行测试了')
            process.exit(0)
        })
        .catch(error => {
            console.error('\n✗ 测试环境准备失败:')
            console.error(error.message)
            process.exit(1)
        })
}
