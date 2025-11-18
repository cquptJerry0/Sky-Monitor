export interface Product {
    id: string
    name: string
    price: number
    originalPrice?: number
    image: string
    category: string
    rating: number
    reviews: number
    stock: number
    description: string
    features: string[]
}

export const products: Product[] = [
    {
        id: 'iphone-15-pro',
        name: 'iPhone 15 Pro',
        price: 7999,
        originalPrice: 8999,
        image: 'https://via.placeholder.com/300x300/1a1a1a/ffffff?text=iPhone+15+Pro',
        category: '手机',
        rating: 4.8,
        reviews: 1234,
        stock: 50,
        description: 'A17 Pro 芯片，钛金属设计，专业级摄像头系统',
        features: ['A17 Pro 芯片', '钛金属设计', '48MP 主摄', '120Hz ProMotion'],
    },
    {
        id: 'macbook-pro-14',
        name: 'MacBook Pro 14"',
        price: 14999,
        originalPrice: 15999,
        image: 'https://via.placeholder.com/300x300/2a2a2a/ffffff?text=MacBook+Pro',
        category: '电脑',
        rating: 4.9,
        reviews: 856,
        stock: 30,
        description: 'M3 Pro 芯片，14 英寸 Liquid Retina XDR 显示屏',
        features: ['M3 Pro 芯片', '14 英寸显示屏', '18 小时续航', '三风扇散热'],
    },
    {
        id: 'airpods-pro-2',
        name: 'AirPods Pro 2',
        price: 1899,
        image: 'https://via.placeholder.com/300x300/3a3a3a/ffffff?text=AirPods+Pro',
        category: '音频',
        rating: 4.7,
        reviews: 2341,
        stock: 100,
        description: '主动降噪，自适应通透模式，空间音频',
        features: ['主动降噪', '自适应通透', '空间音频', 'H2 芯片'],
    },
    {
        id: 'ipad-pro-11',
        name: 'iPad Pro 11"',
        price: 6799,
        originalPrice: 7299,
        image: 'https://via.placeholder.com/300x300/4a4a4a/ffffff?text=iPad+Pro',
        category: '平板',
        rating: 4.8,
        reviews: 567,
        stock: 40,
        description: 'M2 芯片，11 英寸 Liquid Retina 显示屏',
        features: ['M2 芯片', '11 英寸显示屏', 'ProMotion 技术', 'Face ID'],
    },
    {
        id: 'apple-watch-9',
        name: 'Apple Watch Series 9',
        price: 3199,
        image: 'https://via.placeholder.com/300x300/5a5a5a/ffffff?text=Apple+Watch',
        category: '穿戴',
        rating: 4.6,
        reviews: 1890,
        stock: 80,
        description: 'S9 芯片，全天候视网膜显示屏，健康监测',
        features: ['S9 芯片', '全天候显示', '心率监测', '血氧检测'],
    },
    {
        id: 'magic-keyboard',
        name: 'Magic Keyboard',
        price: 799,
        image: 'https://via.placeholder.com/300x300/6a6a6a/ffffff?text=Magic+Keyboard',
        category: '配件',
        rating: 4.5,
        reviews: 432,
        stock: 120,
        description: '无线蓝牙键盘，可充电电池，剪刀式按键',
        features: ['无线蓝牙', '可充电', '剪刀式按键', '多设备切换'],
    },
]

export const categories = ['全部', '手机', '电脑', '平板', '音频', '穿戴', '配件']
