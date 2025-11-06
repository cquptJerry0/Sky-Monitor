import { defineConfig } from 'vite'

// 注意：@sky-monitor/vite-plugin 需要单独安装和配置
// 本配置文件仅作为示例，实际使用时取消注释

export default defineConfig({
    server: {
        port: 5173,
        host: true,
    },
    build: {
        sourcemap: true, // 启用 SourceMap 生成
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
    },
    // SourceMap 上传配置（需要安装 @sky-monitor/vite-plugin）
    // plugins: [
    //     skyMonitorVitePlugin({
    //         appId: 'demo_app_001',
    //         release: '1.0.0-demo',
    //         uploadUrl: 'http://localhost:3000/api/sourcemap/upload',
    //         apiKey: process.env.SKY_MONITOR_API_KEY || 'your-api-key',
    //         include: ['dist/**/*.js', 'dist/**/*.js.map'],
    //         deleteAfterUpload: false, // Demo 保留 .map 文件
    //     }),
    // ],
})
