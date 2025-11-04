import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        port: 3000,
        open: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: 'hidden',
    },
    define: {
        __RELEASE__: JSON.stringify(process.env.RELEASE_VERSION || 'dev'),
    },
})
