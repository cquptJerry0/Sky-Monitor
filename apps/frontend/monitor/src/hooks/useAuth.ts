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
            // 清除认证信息
            clearAuth()

            // 清除所有查询缓存
            queryClient.clear()

            // 清除所有 localStorage (包括其他 store 的持久化数据)
            localStorage.clear()

            // 跳转到登录页
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

/**
 * 修改邮箱 Mutation
 */
export function useUpdateEmail() {
    const { setUser } = useAuthStore()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (email: string) => authAPI.updateEmail(email),
        onSuccess: user => {
            setUser(user)
            queryClient.invalidateQueries({ queryKey: ['currentUser'] })
        },
    })
}

/**
 * 修改密码 Mutation
 */
export function useUpdatePassword() {
    const { setUser } = useAuthStore()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
            authAPI.updatePassword(currentPassword, newPassword),
        onSuccess: user => {
            setUser(user)
            queryClient.invalidateQueries({ queryKey: ['currentUser'] })
        },
    })
}

/**
 * 修改头像 Mutation
 */
export function useUpdateAvatar() {
    const { setUser } = useAuthStore()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (avatar: string) => authAPI.updateAvatar(avatar),
        onSuccess: user => {
            setUser(user)
            queryClient.invalidateQueries({ queryKey: ['currentUser'] })
        },
    })
}

/**
 * 上传头像文件 Mutation
 */
export function useUploadAvatar() {
    const { setUser } = useAuthStore()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (file: File) => authAPI.uploadAvatar(file),
        onSuccess: data => {
            setUser(data.user)
            queryClient.invalidateQueries({ queryKey: ['currentUser'] })
        },
    })
}
