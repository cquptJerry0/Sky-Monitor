import { defineConfig } from 'tsup'

export default defineConfig([
    {
        entry: ['src/index.ts', 'src/tracing/**/*.ts', 'src/transport/**/*.ts'],
        format: ['cjs'],
        sourcemap: true,
        bundle: true,
        dts: false,
        clean: true,
        minify: true,
        outDir: 'build/cjs',
        // 开发环境保留 console.warn 用于调试
        // 生产环境可以通过环境变量控制
        esbuildOptions(options) {
            // 只移除 debugger,保留 console.warn
            options.drop = ['console', 'debugger']
        },
    },
    {
        entry: ['src/index.ts', 'src/tracing/**/*.ts', 'src/transport/**/*.ts'],
        format: ['esm'],
        sourcemap: true,
        bundle: true,
        dts: false,
        clean: true,
        minify: true,
        outDir: 'build/esm',
        // 开发环境保留 console.warn 用于调试
        // 生产环境可以通过环境变量控制
        esbuildOptions(options) {
            // 只移除 debugger,保留 console.warn
            options.drop = ['console', 'debugger']
        },
    },
])
