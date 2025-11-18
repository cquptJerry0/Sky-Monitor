import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface Order {
    id: string
    date: string
    total: number
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
    items: number
}

const mockOrders: Order[] = [
    {
        id: 'ORDER-1234567890',
        date: '2024-01-15',
        total: 7999,
        status: 'delivered',
        items: 1,
    },
    {
        id: 'ORDER-1234567891',
        date: '2024-01-20',
        total: 14999,
        status: 'shipped',
        items: 1,
    },
    {
        id: 'ORDER-1234567892',
        date: '2024-01-25',
        total: 1899,
        status: 'paid',
        items: 1,
    },
]

const statusMap = {
    pending: { label: '待支付', variant: 'secondary' as const },
    paid: { label: '已支付', variant: 'default' as const },
    shipped: { label: '已发货', variant: 'default' as const },
    delivered: { label: '已送达', variant: 'default' as const },
    cancelled: { label: '已取消', variant: 'destructive' as const },
}

export function ProfilePage() {
    return (
        <div className="container py-8">
            <h1 className="mb-6 text-2xl font-bold">个人中心</h1>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>用户信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="text-sm text-muted-foreground">用户名</div>
                            <div className="font-medium">demo_user</div>
                        </div>
                        <Separator />
                        <div>
                            <div className="text-sm text-muted-foreground">邮箱</div>
                            <div className="font-medium">demo@skymonitor.com</div>
                        </div>
                        <Separator />
                        <div>
                            <div className="text-sm text-muted-foreground">用户 ID</div>
                            <div className="font-medium">demo-user-123</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>订单历史</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockOrders.map(order => (
                                <Card key={order.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{order.id}</span>
                                                    <Badge variant={statusMap[order.status].variant}>{statusMap[order.status].label}</Badge>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {order.date} · {order.items} 件商品
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-primary">¥{order.total}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
