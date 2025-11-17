import { products, type Product } from '@/mocks/products'

export async function getProducts(category?: string): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, 300))

    if (!category || category === '全部') {
        return products
    }

    return products.filter(p => p.category === category)
}

export async function getProduct(id: string): Promise<Product | null> {
    await new Promise(resolve => setTimeout(resolve, 200))

    return products.find(p => p.id === id) || null
}

export async function searchProducts(query: string): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, 400))

    const lowerQuery = query.toLowerCase()
    return products.filter(p => p.name.toLowerCase().includes(lowerQuery) || p.description.toLowerCase().includes(lowerQuery))
}
