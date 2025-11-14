import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { skyMonitorPlugin } from '@sky-monitor/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        // 构建时上传 SourceMap（开发环境也可以测试）
        skyMonitorPlugin({
            uploadUrl: 'http://localhost:8081/api/sourcemaps/upload',
            authToken: process.env.SKY_MONITOR_TOKEN || 'dev-token',
            release: process.env.RELEASE_VERSION || 'dev',
            appId: 'vanilla1bhOoq',
            urlPrefix: '~/assets/',
            deleteAfterUpload: false, // 保留 map 文件方便调试
        }),
    ],
    server: {
        port: 5433,
    },
    build: {
        sourcemap: true, // 生成 SourceMap
    },
    define: {
        // 将 release 版本注入到代码中
        __RELEASE__: JSON.stringify(process.env.RELEASE_VERSION || 'dev'),
    },
})
