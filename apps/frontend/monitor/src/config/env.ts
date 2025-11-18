export const env = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081',
    shopDemoUrl: import.meta.env.VITE_SHOP_DEMO_URL || 'http://localhost:5433',
} as const

export function getShopDemoUrl(appId: string): string {
    return `${env.shopDemoUrl}/?appId=${appId}`
}
