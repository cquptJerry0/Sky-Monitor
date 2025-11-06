#!/usr/bin/env ts-node

/**
 * Redis 配置验证脚本（Node.js 版本）
 * 使用 ioredis 库测试 Redis 连接和基本操作
 */

import Redis from 'ioredis'

const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379')
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || 'skyRedis2024'

async function verifyRedis() {
    console.log('================================================')
    console.log('  Redis 配置验证 (Node.js)')
    console.log('================================================')
    console.log('')
    console.log('连接信息：')
    console.log(`  Host: ${REDIS_HOST}`)
    console.log(`  Port: ${REDIS_PORT}`)
    console.log('')

    const redis = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
        retryStrategy: () => null, // 禁用自动重试
    })

    try {
        // 1. 测试连接
        console.log('1. 测试 Redis 连接...')
        const pong = await redis.ping()
        if (pong === 'PONG') {
            console.log('   ✓ Redis 连接成功')
        } else {
            throw new Error('PING 命令返回异常')
        }

        // 2. 检查 Redis 版本
        console.log('')
        console.log('2. 检查 Redis 版本...')
        const info = await redis.info('server')
        const versionMatch = info.match(/redis_version:(\S+)/)
        if (versionMatch) {
            console.log(`   ✓ Redis 版本: ${versionMatch[1]}`)
        } else {
            console.log('   ⚠ 无法获取 Redis 版本')
        }

        // 3. 测试基本操作
        console.log('')
        console.log('3. 测试基本操作...')

        // SET
        await redis.set('sky_monitor_test', 'test_value', 'EX', 10)
        console.log('   ✓ SET 操作成功')

        // GET
        const value = await redis.get('sky_monitor_test')
        if (value === 'test_value') {
            console.log('   ✓ GET 操作成功')
        } else {
            throw new Error(`GET 操作失败，期望 "test_value"，实际 "${value}"`)
        }

        // SETEX
        await redis.setex('sky_monitor_test_ex', 10, 'test_value_ex')
        console.log('   ✓ SETEX 操作成功')

        // DEL
        await redis.del('sky_monitor_test', 'sky_monitor_test_ex')
        console.log('   ✓ DEL 操作成功')

        // 4. 测试列表操作
        console.log('')
        console.log('4. 测试列表操作...')

        await redis.lpush('sky_monitor_list', 'item1', 'item2', 'item3')
        console.log('   ✓ LPUSH 操作成功')

        const items = await redis.lrange('sky_monitor_list', 0, -1)
        if (items.length === 3) {
            console.log('   ✓ LRANGE 操作成功')
        } else {
            throw new Error(`LRANGE 操作失败，期望 3 个元素，实际 ${items.length} 个`)
        }

        await redis.ltrim('sky_monitor_list', 0, 1)
        console.log('   ✓ LTRIM 操作成功')

        await redis.del('sky_monitor_list')
        console.log('   ✓ 清理测试数据成功')

        // 5. 检查内存使用
        console.log('')
        console.log('5. 检查内存使用...')
        const memoryInfo = await redis.info('memory')
        const memoryMatch = memoryInfo.match(/used_memory_human:(\S+)/)
        if (memoryMatch) {
            console.log(`   ✓ 已使用内存: ${memoryMatch[1]}`)
        } else {
            console.log('   ⚠ 无法获取内存信息')
        }

        // 6. 检查持久化配置
        console.log('')
        console.log('6. 检查持久化配置...')
        const saveConfig = (await redis.config('GET', 'save')) as string[]
        const aofConfig = (await redis.config('GET', 'appendonly')) as string[]

        if (saveConfig && saveConfig.length >= 2) {
            console.log(`   RDB 持久化: ${saveConfig[1] || '未配置'}`)
        }
        if (aofConfig && aofConfig.length >= 2) {
            const aofStatus = aofConfig[1] === 'yes' ? '已启用' : '未启用'
            console.log(`   AOF 持久化: ${aofStatus}`)
        }

        console.log('')
        console.log('================================================')
        console.log('  ✅ 验证完成！Redis 配置正常')
        console.log('================================================')
        console.log('')
        console.log('环境变量配置：')
        console.log(`  export REDIS_HOST=${REDIS_HOST}`)
        console.log(`  export REDIS_PORT=${REDIS_PORT}`)
        console.log(`  export REDIS_PASSWORD=${REDIS_PASSWORD}`)

        process.exit(0)
    } catch (error: any) {
        console.error('')
        console.error('❌ 验证失败:', error.message)
        console.error('')
        console.error('可能的原因：')
        console.error('  1. Redis 服务未启动')
        console.error('  2. 密码错误')
        console.error('  3. 端口不正确')
        console.error('  4. 防火墙阻止连接')
        console.error('')
        console.error('启动 Redis：')
        console.error('  macOS:   brew services start redis')
        console.error('  Ubuntu:  sudo systemctl start redis')
        console.error('  Docker:  docker run -d -p 6379:6379 redis:latest redis-server --requirepass skyRedis2024')

        process.exit(1)
    } finally {
        redis.disconnect()
    }
}

verifyRedis()
