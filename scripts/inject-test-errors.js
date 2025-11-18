/**
 * 注入测试错误数据到 ClickHouse
 * 用于测试雷达图显示效果
 *
 * 使用方法:
 * 1. 修改下面的 APP_ID 为你的实际 app_id
 * 2. 运行: node scripts/inject-test-errors.js
 */

const { createClient } = require('@clickhouse/client')

// 配置
const APP_ID = 'vanillaGQqHf7'
const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL || 'http://localhost:8123'
const CLICKHOUSE_DATABASE = process.env.CLICKHOUSE_DATABASE || 'sky_monitor'

// 创建 ClickHouse 客户端
const client = createClient({
    url: CLICKHOUSE_URL,
    database: CLICKHOUSE_DATABASE,
})

// 生成测试数据
function generateTestErrors() {
    const now = Date.now()
    const errors = []

    // JS Error (30条)
    for (let i = 0; i < 30; i++) {
        errors.push({
            app_id: APP_ID,
            event_type: 'error',
            event_name: 'TypeError',
            timestamp: new Date(now - i * 3600000), // 每小时一条
            user_id: `user-${i}`,
            session_id: `session-${i}`,
            page_url: 'https://example.com',
            error_message: 'Cannot read property of undefined',
            error_stack: 'Error stack...',
        })
    }

    // Exception (20条)
    for (let i = 0; i < 20; i++) {
        errors.push({
            app_id: APP_ID,
            event_type: 'exception',
            event_name: 'NetworkError',
            timestamp: new Date(now - i * 3600000),
            user_id: `user-${30 + i}`,
            session_id: `session-${30 + i}`,
            page_url: 'https://example.com',
            error_message: 'Network request failed',
            error_stack: 'Error stack...',
        })
    }

    // Promise Rejection (15条)
    for (let i = 0; i < 15; i++) {
        errors.push({
            app_id: APP_ID,
            event_type: 'unhandledrejection',
            event_name: 'PromiseRejection',
            timestamp: new Date(now - i * 3600000),
            user_id: `user-${50 + i}`,
            session_id: `session-${50 + i}`,
            page_url: 'https://example.com',
            error_message: 'Promise rejected',
            error_stack: 'Error stack...',
        })
    }

    // Network (10条)
    for (let i = 0; i < 10; i++) {
        errors.push({
            app_id: APP_ID,
            event_type: 'network',
            event_name: 'FetchError',
            timestamp: new Date(now - i * 3600000),
            user_id: `user-${65 + i}`,
            session_id: `session-${65 + i}`,
            page_url: 'https://example.com/api',
            error_message: 'Fetch failed',
            error_stack: '',
        })
    }

    // Timeout (5条)
    for (let i = 0; i < 5; i++) {
        errors.push({
            app_id: APP_ID,
            event_type: 'timeout',
            event_name: 'RequestTimeout',
            timestamp: new Date(now - i * 3600000),
            user_id: `user-${75 + i}`,
            session_id: `session-${75 + i}`,
            page_url: 'https://example.com/api',
            error_message: 'Request timeout',
            error_stack: '',
        })
    }

    return errors
}

// 插入数据
async function injectTestData() {
    try {
        console.log('开始注入测试数据...')
        console.log(`APP_ID: ${APP_ID}`)
        console.log(`ClickHouse URL: ${CLICKHOUSE_URL}`)

        const errors = generateTestErrors()
        console.log(`生成 ${errors.length} 条测试错误数据`)

        await client.insert({
            table: 'events',
            values: errors,
            format: 'JSONEachRow',
        })

        console.log('✅ 测试数据注入成功!')
        console.log('\n数据分布:')
        console.log('- JS Error: 30条')
        console.log('- Exception: 20条')
        console.log('- Promise Rejection: 15条')
        console.log('- Network: 10条')
        console.log('- Timeout: 5条')
        console.log('\n现在可以在 Dashboard 中查看雷达图效果了!')
    } catch (error) {
        console.error('❌ 注入失败:', error)
    } finally {
        await client.close()
    }
}

// 执行
injectTestData()
