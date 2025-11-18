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

        esbuildOptions(options) {
            // 移除 console 和 debugger (保留 console.error/warn 用于生产环境错误追踪)
            options.drop = ['debugger']
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

        esbuildOptions(options) {
            // 移除 console 和 debugger (保留 console.error/warn 用于生产环境错误追踪)
            options.drop = ['debugger']
        },
    },
])
