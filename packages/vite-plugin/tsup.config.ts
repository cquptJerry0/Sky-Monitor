import { defineConfig } from 'tsup'

export default defineConfig([
    {
        entry: ['src/index.ts'],
        format: ['cjs'],
        sourcemap: true,
        bundle: true,
        dts: false,
        clean: true,
        minify: false,
        outDir: 'build/cjs',
        external: ['vite'],
    },
    {
        entry: ['src/index.ts'],
        format: ['esm'],
        sourcemap: true,
        bundle: true,
        dts: false,
        clean: true,
        minify: false,
        outDir: 'build/esm',
        external: ['vite'],
    },
])
