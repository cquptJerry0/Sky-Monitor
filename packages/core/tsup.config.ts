import { defineConfig } from 'tsup'

export default defineConfig([
    {
        entry: {
            index: 'src/index.ts',
        },
        format: ['cjs'],
        sourcemap: true,
        bundle: true,
        dts: false,
        clean: true,
        minify: true,
        outDir: 'build/cjs',
        external: ['vitest'],
    },
    {
        entry: {
            index: 'src/index.ts',
        },
        format: ['esm'],
        sourcemap: true,
        bundle: true,
        dts: false,
        clean: true,
        minify: true,
        outDir: 'build/esm',
        external: ['vitest'],
    },
])
