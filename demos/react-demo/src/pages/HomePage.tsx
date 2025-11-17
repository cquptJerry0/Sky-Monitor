import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductGrid } from '@/components/product'
import { getProducts } from '@/api/products'
import { categories } from '@/mocks/products'
import type { Product } from '@/mocks/products'

export function HomePage() {
    const [products, setProducts] = useState<Product[]>([])
    const [category, setCategory] = useState('全部')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true)
            try {
                const data = await getProducts(category)
                setProducts(data)
            } catch (error) {
                console.error('Failed to load products:', error)
            } finally {
                setLoading(false)
            }
        }

        loadProducts()
    }, [category])

    return (
        <div className="container py-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">商品列表</h1>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>
                                {cat}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex min-h-[400px] items-center justify-center">
                    <p className="text-muted-foreground">加载中...</p>
                </div>
            ) : (
                <ProductGrid products={products} />
            )}
        </div>
    )
}
