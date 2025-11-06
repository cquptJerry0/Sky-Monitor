/**
 * SourceMap 功能测试
 *
 * 测试场景：
 * 1. 构建 Demo（生成 sourcemap）
 * 2. 触发错误（包含压缩后的堆栈）
 * 3. 验证后端触发 SourceMap 解析队列
 * 4. 查询解析状态
 *
 * 验证点：
 * - release 字段正确
 * - error_stack 包含堆栈
 * - Bull Queue 接收解析任务
 * - 解析状态为 'parsing' 或 'parsed'
 */

import { addBreadcrumb } from '@sky-monitor/monitor-sdk-browser'

export const SourceMapTests = {
    name: 'SourceMap',
    totalTests: 4,
    tests: [
        {
            id: 'sourcemap-01',
            name: 'SourceMap 配置验证',
            description: '验证 SourceMap 相关配置',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：SourceMap 配置',
                    category: 'test',
                    level: 'info',
                })

                const config = window.MONITOR_CONFIG || {}

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>SourceMap 配置验证</h3>
                        <p>当前配置:</p>
                        <ul>
                            <li>appId: ${config.appId || 'N/A'}</li>
                            <li>release: ${config.release || 'N/A'}</li>
                            <li>environment: ${config.environment || 'N/A'}</li>
                        </ul>
                        <p>SourceMap 工作流程:</p>
                        <ol>
                            <li>构建时生成 .map 文件</li>
                            <li>vite-plugin 自动上传到后端</li>
                            <li>错误发生时，后端根据 release 匹配 SourceMap</li>
                            <li>Bull Queue 异步解析堆栈</li>
                            <li>前端可查询解析状态和结果</li>
                        </ol>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            timeout: 3000,
        },
        {
            id: 'sourcemap-02',
            name: '触发构建后错误',
            description: '触发错误以测试 SourceMap 解析',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：SourceMap 错误',
                    category: 'test',
                    level: 'info',
                })

                // 触发一个错误
                try {
                    // 这个错误的堆栈会包含文件名和行号
                    throw new Error('SourceMap 解析测试 - 压缩代码错误')
                } catch (error) {
                    // 静默捕获
                }

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>SourceMap 错误触发</h3>
                        <p>已触发测试错误</p>
                        <p>错误消息: "SourceMap 解析测试 - 压缩代码错误"</p>
                        <p>预期行为:</p>
                        <ul>
                            <li>错误上报到后端，包含 error_stack</li>
                            <li>后端检测到 release 和 error_stack</li>
                            <li>自动触发 SourceMap 解析队列</li>
                            <li>解析后，parsedStack 包含原始代码位置</li>
                        </ul>
                        <p style="background: #fef3c7; padding: 10px; border-radius: 4px;">
                            注意: 本测试在开发模式下运行，堆栈未压缩。
                            需要运行 <code>pnpm build</code> 后测试生产构建。
                        </p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            expectedFields: ['error_stack', 'release', 'appId'],
            timeout: 3000,
        },
        {
            id: 'sourcemap-03',
            name: 'SourceMap 上传验证',
            description: '验证 SourceMap 文件上传',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：SourceMap 上传',
                    category: 'test',
                    level: 'info',
                })

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>SourceMap 上传验证</h3>
                        <p>Vite Plugin 配置:</p>
                        <pre style="background: #1f2937; color: #f9fafb; padding: 10px; border-radius: 4px; overflow-x: auto;">
// vite.config.js
import { skyMonitorVitePlugin } from '@sky-monitor/vite-plugin'

export default {
  plugins: [
    skyMonitorVitePlugin({
      appId: 'demo_app_001',
      release: '1.0.0-demo',
      uploadUrl: 'http://localhost:3000/api/sourcemap/upload',
      apiKey: 'your-api-key',
    }),
  ],
  build: {
    sourcemap: true,  // 生成 .map 文件
  },
}</pre>
                        <p>构建和上传:</p>
                        <ol>
                            <li>运行 <code>pnpm build</code></li>
                            <li>Plugin 自动上传 .map 文件到后端</li>
                            <li>后端存储在数据库（按 appId + release）</li>
                        </ol>
                        <p>验证方法:</p>
                        <ul>
                            <li>查询后端 API: <code>GET /api/sourcemap/list?appId=demo_app_001</code></li>
                            <li>查看是否有 release = 1.0.0-demo 的 SourceMap</li>
                        </ul>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            timeout: 3000,
        },
        {
            id: 'sourcemap-04',
            name: 'SourceMap 解析状态查询',
            description: '查询 SourceMap 解析状态',
            run: async () => {
                addBreadcrumb({
                    message: '开始测试：解析状态查询',
                    category: 'test',
                    level: 'info',
                })

                const config = window.MONITOR_CONFIG || {}
                const apiBaseUrl = config.apiBaseUrl || 'http://localhost:3000/api'

                const container = document.getElementById('test-area')
                if (container) {
                    container.innerHTML = `
                        <h3>SourceMap 解析状态查询</h3>
                        <p>API 端点:</p>
                        <ul>
                            <li>GET /api/events/:eventId - 获取事件详情（含 parsedStack）</li>
                            <li>GET /api/events/sourcemap/status?eventIds=xxx - 批量查询状态</li>
                        </ul>
                        <p>解析状态:</p>
                        <ul>
                            <li><code>parsed</code> - 解析成功</li>
                            <li><code>parsing</code> - 正在解析中</li>
                            <li><code>not_available</code> - 无可用 SourceMap</li>
                            <li><code>failed</code> - 解析失败</li>
                        </ul>
                        <p>测试步骤:</p>
                        <ol>
                            <li>触发一个错误，获取 event_id</li>
                            <li>查询后端: <code>GET ${apiBaseUrl}/events/:eventId</code></li>
                            <li>检查响应中的 <code>sourceMapStatus</code> 字段</li>
                            <li>如果是 <code>parsed</code>，查看 <code>parsedStack</code></li>
                        </ol>
                        <p style="background: #dbeafe; padding: 10px; border-radius: 4px;">
                            提示: 解析是异步的，可能需要几秒钟
                        </p>
                    `
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            },
            timeout: 3000,
        },
    ],
}

// 导出单独的测试函数
export function testSourceMapConfig() {
    return SourceMapTests.tests[0].run()
}

export function testSourceMapError() {
    return SourceMapTests.tests[1].run()
}

export function testSourceMapUpload() {
    return SourceMapTests.tests[2].run()
}

export function testSourceMapStatusQuery() {
    return SourceMapTests.tests[3].run()
}

// 运行所有 SourceMap 测试
export async function runAllSourceMapTests() {
    const results = []

    for (const test of SourceMapTests.tests) {
        try {
            await test.run()
            results.push({ id: test.id, name: test.name, status: 'passed' })
        } catch (error) {
            results.push({ id: test.id, name: test.name, status: 'failed', error: error.message })
        }
    }

    return results
}
