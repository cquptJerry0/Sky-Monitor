import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Product } from '@/mocks/products'
import { useCartStore } from '@/store/cart'
import { toast } from '@/hooks/use-toast'

interface ProductCardProps {
    product: Product
}

export function ProductCard({ product }: ProductCardProps) {
    const addItem = useCartStore(state => state.addItem)

    const handleAddToCart = () => {
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

    const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

    return (
        <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
            <Link to={`/product/${product.id}`}>
                <div className="aspect-square overflow-hidden bg-muted">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                </div>
            </Link>
            <CardContent className="p-4">
                <Link to={`/product/${product.id}`}>
                    <h3 className="mb-2 line-clamp-2 text-sm font-medium hover:text-primary">{product.name}</h3>
                </Link>
                <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span>{product.rating}</span>
                    <span>({product.reviews})</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-primary">¥{product.price}</span>
                    {product.originalPrice && (
                        <>
                            <span className="text-sm text-muted-foreground line-through">¥{product.originalPrice}</span>
                            <Badge variant="destructive" className="text-xs">
                                -{discount}%
                            </Badge>
                        </>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button onClick={handleAddToCart} className="w-full" size="sm">
                    加入购物车
                </Button>
            </CardFooter>
        </Card>
    )
}
