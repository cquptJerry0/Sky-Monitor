import { defineConfig } from 'tsup'

export default defineConfig([
    {
        entry: ['src/index.ts'],
        format: ['cjs'],
        sourcemap: true,
        bundle: true,
        dts: false,
        clean: true,
        minify: true,
        outDir: 'build/cjs',
        // 生产环境移除 console.log 和 debugger
        esbuildOptions(options) {
            options.drop = ['console', 'debugger']
        },
    },
    {
        entry: ['src/index.ts'],
        format: ['esm'],
        sourcemap: true,
        bundle: true,
        dts: false,
        clean: true,
        minify: true,
        outDir: 'build/esm',
        // 生产环境移除 console.log 和 debugger
        esbuildOptions(options) {
            options.drop = ['console', 'debugger']
        },
    },
])
