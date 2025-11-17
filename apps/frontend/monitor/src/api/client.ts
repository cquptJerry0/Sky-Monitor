/**
 * Axios 客户端配置
 *
 * 包含：
 * 1. 请求拦截器：自动附加 Access Token
 * 2. 响应拦截器：处理 401 自动刷新 Token
 * 3. 错误处理
 */

import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import { API_BASE_URL } from '@/utils/constants'

/**
 * 自定义 Axios 实例类型
 * 由于响应拦截器返回 response.data，所以类型应该是 T 而不是 AxiosResponse<T>
 */
interface CustomAxiosInstance {
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
    post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
    put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
    delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
    patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
}

/**
 * 创建 Axios 实例
 */
const axiosInstance = axios.create({
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
axiosInstance.interceptors.request.use(
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
interface RetryConfig extends InternalAxiosRequestConfig {
    _retry?: boolean
}

axiosInstance.interceptors.response.use(
    response => {
        // 后端统一返回格式: { success: true, data: T }
        // 我们需要解包 response.data，返回其中的 data 字段

        const responseData = response.data

        // 检查是否是标准的包装格式 { success: boolean, data: T }
        if (responseData && typeof responseData === 'object' && 'success' in responseData) {
            // 如果 success 为 false，抛出错误
            if (responseData.success === false) {
                const errorMessage = responseData.message || '请求失败'
                throw new Error(errorMessage)
            }

            // success 为 true，返回解包后的数据
            if ('data' in responseData) {
                return responseData.data
            }
        }

        // 兼容没有包装的响应（直接返回原始数据）
        return responseData
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryConfig

        // 处理 401 错误：尝试刷新 Token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                // 调用刷新 Token 接口
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })

                // 后端返回格式: { success: true, data: { access_token: '...', expires_in: 900 } }
                const newToken = response.data?.data?.access_token || response.data?.access_token

                if (!newToken) {
                    console.error('[Token 刷新] 错误: 响应中没有 access_token', response.data)
                    throw new Error('Token 刷新失败：响应格式错误')
                }

                // 更新 Store 中的 Token
                useAuthStore.getState().setAccessToken(newToken)

                // 重试原始请求
                originalRequest.headers.Authorization = `Bearer ${newToken}`

                return axiosInstance(originalRequest)
            } catch (refreshError) {
                // 刷新失败，清除认证信息并跳转到登录页
                useAuthStore.getState().clearAuth()

                window.location.href = '/auth/login'
                return Promise.reject(refreshError)
            }
        }

        // 其他错误：尝试从响应中提取错误消息
        if (error.response?.data) {
            const errorData = error.response.data as any
            const errorMessage = errorData.message || error.message || '请求失败'
            return Promise.reject(new Error(errorMessage))
        }

        // 网络错误或其他错误
        return Promise.reject(error)
    }
)

/**
 * 导出类型安全的 client
 * 类型定义反映了响应拦截器的实际行为（返回 response.data）
 */
export const client = axiosInstance as unknown as CustomAxiosInstance

/**
 * 获取错误消息
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        return error.response?.data?.message || error.message || '请求失败'
    }
    if (error instanceof Error) {
        return error.message
    }
    return '请求失败'
}
