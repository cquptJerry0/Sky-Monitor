import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { CartItem as CartItemType } from '@/store/cart'
import { useCartStore } from '@/store/cart'

interface CartItemProps {
    item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
    const { updateQuantity, removeItem } = useCartStore()

    return (
        <Card className="p-4">
            <div className="flex gap-4">
                <img src={item.image} alt={item.name} className="h-24 w-24 rounded object-cover" />
                <div className="flex flex-1 flex-col justify-between">
                    <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-lg font-bold text-primary">¥{item.price}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold">¥{item.price * item.quantity}</p>
                </div>
            </div>
        </Card>
    )
}
