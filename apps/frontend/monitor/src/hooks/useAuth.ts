/**
 * 认证相关 Hook
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { authAPI } from '@/api'
import type { User } from '@/api/types'

/**
 * 使用认证状态
 */
export function useAuth() {
    const { isAuthenticated, user, setAccessToken, setUser, clearAuth } = useAuthStore()

    return {
        isAuthenticated,
        user,
        setAccessToken,
        setUser,
        clearAuth,
    }
}

/**
 * 登录 Mutation
 */
export function useLogin() {
    const { setAccessToken } = useAuthStore()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ username, password }: { username: string; password: string }) => {
            const response = await authAPI.login(username, password)
            return response
        },
        onSuccess: (data: { access_token: string; expires_in: number } | { data: { access_token: string; expires_in: number } }) => {
            // 保存 Token
            if ('data' in data && data.data?.access_token) {
                setAccessToken(data.data.access_token)
            } else if ('access_token' in data) {
                setAccessToken(data.access_token)
            }

            // 获取用户信息
            queryClient.invalidateQueries({ queryKey: ['currentUser'] })
        },
    })
}

/**
 * 登出 Mutation
 */
export function useLogout() {
    const { clearAuth } = useAuthStore()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: authAPI.logout,
        onSuccess: () => {
            clearAuth()
            queryClient.clear()
            window.location.href = '/auth/login'
        },
    })
}

/**
 * 获取当前用户信息
 */
export function useCurrentUser() {
    const { isAuthenticated, setUser } = useAuthStore()

    return useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const response = await authAPI.getCurrentUser()
            // 后端返回格式可能是 User 或 { data: User }
            const user =
                typeof response === 'object' && response !== null && 'data' in response
                    ? (response as { data: User }).data
                    : (response as User)
            setUser(user)
            return user
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 分钟
    })
}
