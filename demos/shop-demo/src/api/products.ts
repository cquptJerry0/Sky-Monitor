import { products, type Product } from '@/mocks/products'

// 使用真实 HTTP 请求来触发 SDK 的性能监控和错误监控
const USE_REAL_HTTP = true

export async function getProducts(category?: string): Promise<Product[]> {
    if (USE_REAL_HTTP) {
        // 使用 httpbin.org 模拟慢请求 (延迟 1 秒)
        try {
            const response = await fetch('https://httpbin.org/delay/1')
            await response.json()
        } catch (error) {
            // 忽略错误,继续返回 mock 数据
        }
    } else {
        await new Promise(resolve => setTimeout(resolve, 300))
    }

    if (!category || category === '全部') {
        return products
    }

    return products.filter(p => p.category === category)
}

export async function getProduct(id: string): Promise<Product | null> {
    if (USE_REAL_HTTP) {
        // 使用 httpbin.org 模拟正常请求
        try {
            const response = await fetch('https://httpbin.org/delay/0')
            await response.json()
        } catch (error) {
            // 忽略错误,继续返回 mock 数据
        }
    } else {
        await new Promise(resolve => setTimeout(resolve, 200))
    }

    return products.find(p => p.id === id) || null
}

export async function searchProducts(query: string): Promise<Product[]> {
    if (USE_REAL_HTTP) {
        // 使用 httpbin.org 模拟慢请求 (延迟 2 秒)
        try {
            const response = await fetch('https://httpbin.org/delay/2')
            await response.json()
        } catch (error) {
            // 忽略错误,继续返回 mock 数据
        }
    } else {
        await new Promise(resolve => setTimeout(resolve, 400))
    }

    const lowerQuery = query.toLowerCase()
    return products.filter(p => p.name.toLowerCase().includes(lowerQuery) || p.description.toLowerCase().includes(lowerQuery))
}
