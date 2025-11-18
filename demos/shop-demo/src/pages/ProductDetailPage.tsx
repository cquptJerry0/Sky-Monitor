import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getProduct } from '@/api/products'
import { useCartStore } from '@/store/cart'
import { toast } from '@/hooks/use-toast'
import type { Product } from '@/mocks/products'

export function ProductDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const addItem = useCartStore(state => state.addItem)

    useEffect(() => {
        const loadProduct = async () => {
            if (!id) return

            setLoading(true)
            try {
                const data = await getProduct(id)
                setProduct(data)
            } catch (error) {
                console.error('Failed to load product:', error)
                toast({
                    title: '加载失败',
                    description: '无法加载商品详情',
                    variant: 'destructive',
                })
            } finally {
                setLoading(false)
            }
        }

        loadProduct()
    }, [id])

    const handleAddToCart = () => {
        if (!product) return

        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
        })
        toast({
            title: '已添加到购物车',
            description: product.name,
        })
    }

    const handleBuyNow = () => {
        handleAddToCart()
        navigate('/cart')
    }

    if (loading) {
        return (
            <div className="container flex min-h-[400px] items-center justify-center py-8">
                <p className="text-muted-foreground">加载中...</p>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="container flex min-h-[400px] items-center justify-center py-8">
                <p className="text-muted-foreground">商品不存在</p>
            </div>
        )
    }

    const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

    return (
        <div className="container py-8">
            <div className="grid gap-8 md:grid-cols-2">
                <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                </div>

                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-primary text-primary" />
                                <span>{product.rating}</span>
                            </div>
                            <span>|</span>
                            <span>{product.reviews} 评价</span>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-primary">¥{product.price}</span>
                            {product.originalPrice && (
                                <>
                                    <span className="text-lg text-muted-foreground line-through">¥{product.originalPrice}</span>
                                    <Badge variant="destructive">-{discount}%</Badge>
                                </>
                            )}
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="mb-2 font-semibold">商品描述</h3>
                        <p className="text-muted-foreground">{product.description}</p>
                    </div>

                    <div>
                        <h3 className="mb-2 font-semibold">产品特性</h3>
                        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                            {product.features.map((feature, index) => (
                                <li key={index}>{feature}</li>
                            ))}
                        </ul>
                    </div>

                    <Separator />

                    <div className="flex gap-3">
                        <Button onClick={handleAddToCart} variant="outline" size="lg" className="flex-1">
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            加入购物车
                        </Button>
                        <Button onClick={handleBuyNow} size="lg" className="flex-1">
                            立即购买
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">库存</span>
                                <span className="font-medium">{product.stock} 件</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
