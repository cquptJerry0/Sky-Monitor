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
    // 使用真实 HTTP 请求来触发 SDK 的性能监控
    try {
        const response = await fetch('https://httpbin.org/delay/1')
        await response.json()
    } catch (error) {
        // 忽略错误,继续创建订单
    }

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
    // 使用真实 HTTP 请求来触发 SDK 的 HTTP 错误监控
    // 30% 概率触发 500 错误
    const shouldFail = Math.random() < 0.3

    if (shouldFail) {
        try {
            // 触发 500 错误
            const response = await fetch('https://httpbin.org/status/500')
            if (!response.ok) {
                throw new Error(`支付失败: HTTP ${response.status}`)
            }
        } catch (error) {
            throw new Error('支付失败: 服务器错误')
        }
    } else {
        // 正常支付流程
        try {
            const response = await fetch('https://httpbin.org/delay/1')
            await response.json()
        } catch (error) {
            // 忽略错误
        }
    }

    return { success: true }
}
