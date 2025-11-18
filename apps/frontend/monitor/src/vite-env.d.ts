/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly VITE_SHOP_DEMO_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
