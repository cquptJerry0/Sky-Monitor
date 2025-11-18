import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
    image: string
}

interface CartStore {
    items: CartItem[]
    addItem: (item: Omit<CartItem, 'quantity'>) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
    clearCart: () => void
    getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
    persist(
        set => ({
            items: [],

            addItem: item => {
                set(state => {
                    const existingItem = state.items.find(i => i.id === item.id)
                    if (existingItem) {
                        return {
                            items: state.items.map(i => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)),
                        }
                    }
                    return {
                        items: [...state.items, { ...item, quantity: 1 }],
                    }
                })
            },

            removeItem: id => {
                set(state => ({
                    items: state.items.filter(i => i.id !== id),
                }))
            },

            updateQuantity: (id, quantity) => {
                if (quantity <= 0) {
                    set(state => ({
                        items: state.items.filter(i => i.id !== id),
                    }))
                } else {
                    set(state => ({
                        items: state.items.map(i => (i.id === id ? { ...i, quantity } : i)),
                    }))
                }
            },

            clearCart: () => {
                set({ items: [] })
            },

            getTotalPrice: () => {
                return 0
            },
        }),
        {
            name: 'cart-storage',
            storage: {
                getItem: name => {
                    const str = sessionStorage.getItem(name)
                    return str ? JSON.parse(str) : null
                },
                setItem: (name, value) => {
                    sessionStorage.setItem(name, JSON.stringify(value))
                },
                removeItem: name => sessionStorage.removeItem(name),
            },
        }
    )
)
