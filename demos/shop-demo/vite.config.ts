import path from 'node:path'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { skyMonitorPlugin } from '@sky-monitor/vite-plugin'

// 生成唯一的 release 版本
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
const RELEASE_VERSION = process.env.RELEASE_VERSION || `v1.0.0-${timestamp}`

// 从环境变量读取 appId,用于 build 时上传 sourcemap
const APP_ID = process.env.APP_ID || 'vanilla1bhOoq'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        // 构建时上传 SourceMap
        skyMonitorPlugin({
            uploadUrl: 'http://localhost:8081/api/sourcemaps/upload',
            authToken: process.env.SKY_MONITOR_TOKEN || 'dev-token',
            release: RELEASE_VERSION,
            appId: APP_ID,
            urlPrefix: '~/assets/',
            deleteAfterUpload: false,
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5433,
    },
    build: {
        sourcemap: true, // 生成 SourceMap
        minify: 'esbuild',
    },
    esbuild: {
        drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    define: {
        // 将 release 版本注入到代码中
        __RELEASE__: JSON.stringify(RELEASE_VERSION),
    },
})
