/**
 * 认证状态管理
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/api/types'

interface AuthState {
    // 状态
    accessToken: string | null
    user: User | null
    isAuthenticated: boolean

    // 操作
    setAccessToken: (token: string) => void
    setUser: (user: User) => void
    clearAuth: () => void
}

/**
 * 认证状态 Store
 *
 * 使用 Zustand 管理认证状态，并持久化到 localStorage
 */
export const useAuthStore = create<AuthState>()(
    persist(
        set => ({
            // 初始状态
            accessToken: null,
            user: null,
            isAuthenticated: false,

            // 设置 Access Token
            setAccessToken: (token: string) => {
                set({
                    accessToken: token,
                    isAuthenticated: !!token,
                })
            },

            // 设置用户信息
            setUser: (user: User) => {
                set({ user })
            },

            // 清除认证信息
            clearAuth: () => {
                set({
                    accessToken: null,
                    user: null,
                    isAuthenticated: false,
                })
            },
        }),
        {
            name: 'auth-storage',
            // 只持久化 accessToken 和 user
            partialize: state => ({
                accessToken: state.accessToken,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
