import { Link } from 'react-router-dom'
import { ShoppingCart, User, Search, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart'

export function Header() {
    const cartItems = useCartStore(state => state.items)
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background">
            <div className="container mx-auto flex h-16 items-center gap-4 px-4">
                <Link to="/" className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-primary">Sky Shop</div>
                </Link>

                <div className="flex flex-1 items-center gap-4">
                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="search" placeholder="搜索商品..." className="pl-10" />
                    </div>
                </div>

                <nav className="flex items-center gap-2">
                    <Link to="/settings">
                        <Button variant="ghost" size="icon">
                            <Settings className="h-5 w-5" />
                        </Button>
                    </Link>

                    <Link to="/account">
                        <Button variant="ghost" size="icon">
                            <User className="h-5 w-5" />
                        </Button>
                    </Link>

                    <Link to="/cart">
                        <Button variant="ghost" size="icon" className="relative">
                            <ShoppingCart className="h-5 w-5" />
                            {cartCount > 0 && (
                                <Badge className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs">
                                    {cartCount}
                                </Badge>
                            )}
                        </Button>
                    </Link>
                </nav>
            </div>
        </header>
    )
}
