import type { CartItem } from '@/store/cart'

export interface Order {
    id: string
    items: CartItem[]
    totalPrice: number
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
    createdAt: Date
}

export interface CheckoutData {
    name: string
    phone: string
    address: string
    paymentMethod: 'alipay' | 'wechat' | 'card'
}

export async function createOrder(items: CartItem[], _checkoutData: CheckoutData): Promise<Order> {
    await new Promise(resolve => setTimeout(resolve, 500))

    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const order: Order = {
        id: `ORDER-${Date.now()}`,
        items,
        totalPrice,
        status: 'pending',
        createdAt: new Date(),
    }

    return order
}

export async function payOrder(_orderId: string): Promise<{ success: boolean; message?: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 100% 支付失败 - 抛出错误让 SDK 捕获
    throw new Error('支付失败: 余额不足')
}
