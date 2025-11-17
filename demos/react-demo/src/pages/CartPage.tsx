import { useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CartItem } from '@/components/cart'
import { useCartStore } from '@/store/cart'

export function CartPage() {
    const navigate = useNavigate()
    const { items, clearCart } = useCartStore()

    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

    if (items.length === 0) {
        return (
            <div className="container flex min-h-[400px] flex-col items-center justify-center py-8">
                <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground" />
                <h2 className="mb-2 text-xl font-semibold">购物车是空的</h2>
                <p className="mb-4 text-muted-foreground">快去挑选商品吧</p>
                <Button onClick={() => navigate('/')}>去购物</Button>
            </div>
        )
    }

    return (
        <div className="container py-8">
            <h1 className="mb-6 text-2xl font-bold">购物车</h1>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    {items.map(item => (
                        <CartItem key={item.id} item={item} />
                    ))}
                </div>

                <div>
                    <Card className="sticky top-4">
                        <CardContent className="p-6">
                            <h2 className="mb-4 text-lg font-semibold">订单摘要</h2>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">商品数量</span>
                                    <span>{totalItems} 件</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">商品总价</span>
                                    <span>¥{totalPrice}</span>
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="mb-4 flex justify-between text-lg font-bold">
                                <span>总计</span>
                                <span className="text-primary">¥{totalPrice}</span>
                            </div>

                            <Button onClick={() => navigate('/checkout')} className="w-full" size="lg">
                                去结算
                            </Button>

                            <Button onClick={clearCart} variant="ghost" className="mt-2 w-full" size="sm">
                                清空购物车
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
