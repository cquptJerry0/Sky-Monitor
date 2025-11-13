import { defineConfig } from 'tsup'

export default defineConfig([
    {
        entry: ['src/index.ts'],
        format: ['cjs'],
        sourcemap: true,
        bundle: true,
        dts: false,
        clean: true,
        outDir: 'build/cjs',
    },
    {
        entry: ['src/index.ts'],
        format: ['esm'],
        sourcemap: true,
        bundle: true,
        dts: false,
        clean: true,
        outDir: 'build/esm',
    },
])
