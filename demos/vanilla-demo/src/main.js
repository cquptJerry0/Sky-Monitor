import { init, Errors, Metrics } from '@sky-monitor/monitor-sdk-browser'

// 初始化SDK
// 注意：将这里的appId替换为你从管理后台创建的实际应用ID
const APP_ID = 'vanillafmoxti' // 示例appId，请替换为真实的

console.log('🚀 初始化 Sky Monitor SDK...')

const monitoring = init({
    dsn: `http://localhost:8080/api/monitoring/${APP_ID}`,
    integrations: [new Errors(), new Metrics()],
})

console.log('✅ Sky Monitor SDK 初始化成功')
console.log('📊 DSN:', `http://localhost:8080/api/monitoring/${APP_ID}`)
console.log('🔧 已启用的集成:', ['Errors', 'Metrics'])

// 导出monitoring实例供其他模块使用
window.monitoring = monitoring

// 页面加载完成后输出信息
window.addEventListener('load', () => {
    console.log('✅ 页面加载完成')
    console.log('📈 性能指标将自动收集并上报')
})
