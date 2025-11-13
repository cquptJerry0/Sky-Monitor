import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { skyMonitorPlugin } from '@sky-monitor/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        // 生产构建时上传 SourceMap
        process.env.NODE_ENV === 'production' &&
            skyMonitorPlugin({
                uploadUrl: 'http://localhost:8081/api/sourcemaps/upload',
                authToken: process.env.SKY_MONITOR_TOKEN || 'dev-token',
                release: process.env.RELEASE_VERSION || 'dev',
                appId: 'reactddthD9',
                urlPrefix: '~/assets/',
                deleteAfterUpload: false, // 开发环境保留 map 文件
            }),
    ].filter(Boolean),
    server: {
        port: 5433,
    },
    build: {
        sourcemap: true, // 生成 SourceMap
    },
})
