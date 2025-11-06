import { defineConfig } from 'vitest/config'
import * as path from 'path'

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom', // 浏览器环境
        include: ['src/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/build/**', '**/.turbo/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.test.ts', 'src/__tests__/**', 'src/**/index.ts', 'src/types/**'],
        },
        setupFiles: ['./vitest.setup.ts'],
    },
    resolve: {
        alias: {
            '@sky-monitor/monitor-sdk-browser-utils': path.resolve(__dirname, '../browser-utils/src/index.ts'),
            '@sky-monitor/monitor-sdk-core': path.resolve(__dirname, '../core/src/index.ts'),
        },
    },
})
