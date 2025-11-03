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
    },
])
