/**
 * Axios 客户端配置
 *
 * 包含：
 * 1. 请求拦截器：自动附加 Access Token
 * 2. 响应拦截器：处理 401 自动刷新 Token
 * 3. 错误处理
 */

import axios, { type AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import { API_BASE_URL } from '@/utils/constants'

/**
 * 创建 Axios 实例
 */
export const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true, // 发送 Cookie（用于 Refresh Token）
    headers: {
        'Content-Type': 'application/json',
    },
})

/**
 * 请求拦截器：附加 Access Token
 */
client.interceptors.request.use(
    config => {
        const token = useAuthStore.getState().accessToken
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

/**
 * 响应拦截器：处理 401 自动刷新 Token
 */
client.interceptors.response.use(
    response => {
        // 直接返回 data，简化调用
        return response.data
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as any

        // 处理 401 错误：尝试刷新 Token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                // 调用刷新 Token 接口
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })

                const newToken = response.data.access_token

                // 更新 Store 中的 Token
                useAuthStore.getState().setAccessToken(newToken)

                // 重试原始请求
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return client(originalRequest)
            } catch (refreshError) {
                // 刷新失败，清除认证信息并跳转到登录页
                useAuthStore.getState().clearAuth()
                window.location.href = '/auth/login'
                return Promise.reject(refreshError)
            }
        }

        // 其他错误直接抛出
        return Promise.reject(error)
    }
)

/**
 * 获取错误消息
 */
export function getErrorMessage(error: any): string {
    if (error.response?.data?.message) {
        return error.response.data.message
    }
    if (error.message) {
        return error.message
    }
    return '请求失败'
}
