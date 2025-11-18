import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCartStore } from '@/store/cart'
import { createOrder, payOrder } from '@/api/orders'
import { toast } from '@/hooks/use-toast'

export function CheckoutPage() {
    const navigate = useNavigate()
    const { items, clearCart } = useCartStore()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        paymentMethod: 'alipay' as 'alipay' | 'wechat' | 'card',
    })

    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    if (items.length === 0) {
        navigate('/cart')
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.phone || !formData.address) {
            toast({
                title: '请填写完整信息',
                variant: 'destructive',
            })
            return
        }

        setLoading(true)

        try {
            const order = await createOrder(items, formData)

            // 支付失败会抛出错误,让 SDK 捕获
            await payOrder(order.id)

            // 支付成功
            toast({
                title: '支付成功',
                description: `订单号: ${order.id}`,
            })
            clearCart()
            navigate('/')
        } catch (error) {
            // 不要在这里 catch,让错误向上传播给 SDK
            // 但是要给用户友好的提示
            const errorMessage = error instanceof Error ? error.message : '支付失败,请稍后重试'
            toast({
                title: '支付失败',
                description: errorMessage,
                variant: 'destructive',
            })
            // 重新抛出错误,让 SDK 捕获
            throw error
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container py-8">
            <h1 className="mb-6 text-2xl font-bold">结算</h1>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>收货信息</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium">姓名</label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="请输入姓名"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium">电话</label>
                                    <Input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="请输入电话"
                                        type="tel"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium">地址</label>
                                    <Input
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="请输入地址"
                                        required
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>支付方式</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select
                                    value={formData.paymentMethod}
                                    onValueChange={value => setFormData({ ...formData, paymentMethod: value as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="alipay">支付宝</SelectItem>
                                        <SelectItem value="wechat">微信支付</SelectItem>
                                        <SelectItem value="card">银行卡</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle>订单摘要</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    {items.map(item => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                {item.name} x {item.quantity}
                                            </span>
                                            <span>¥{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <Separator />

                                <div className="flex justify-between text-lg font-bold">
                                    <span>总计</span>
                                    <span className="text-primary">¥{totalPrice}</span>
                                </div>

                                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                    {loading ? '处理中...' : '提交订单'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    )
}
