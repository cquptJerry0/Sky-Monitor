/**
 * Axios 请求配置和双 Token 认证拦截器
 *
 *  业务逻辑：
 * 1. 统一的 API 请求配置（baseURL、timeout）
 * 2. 自动附加 access token 到请求头
 * 3. access token 过期时自动刷新
 * 4. 处理并发请求的 token 刷新（防止重复刷新）
 * 5. refresh token 失败时跳转登录页
 *
 *  技术要点：
 * 1. Axios 拦截器机制
 * 2. 双 Token 认证流程
 * 3. Promise 队列处理并发
 * 4. 错误处理和降级
 *
 * 为什么用双 Token？
 * - 安全性：access token 短期（15分钟），泄露风险小
 * - 用户体验：refresh token 长期（7天），不需要频繁登录
 * - 平衡：安全 + 便利
 */

import axios, { CreateAxiosDefaults, AxiosError, InternalAxiosRequestConfig } from 'axios'
import axiosRetry from 'axios-retry'

import { toast } from '@/hooks/use-toast'
import { tokenManager } from '@/utils/token-manager'

// ==================== Axios 实例配置 ====================
const config: CreateAxiosDefaults = {
    baseURL: '/api', // API 基础路径
    timeout: 10000, // 请求超时时间（10秒）
    withCredentials: true, // 允许发送和接收 Cookie
}

export const request = axios.create(config)

// ==================== 请求重试配置 ====================
/**
 * 配置自动重试机制
 *
 * 重试策略：
 * - 仅重试网络错误和 5xx 服务器错误
 * - 不重试 4xx 客户端错误（如 401、403、404）
 * - 使用指数退避策略（1秒、2秒、4秒）
 * - 最多重试 3 次
 */
axiosRetry(request, {
    retries: 3, // 重试次数
    retryDelay: axiosRetry.exponentialDelay, // 指数退避延迟
    retryCondition: error => {
        // 网络错误或服务器错误（5xx）时重试
        // 不重试 4xx 错误，特别是 401（未授权）
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response?.status ? error.response.status >= 500 : false)
    },
    onRetry: (retryCount, error, requestConfig) => {
        console.log(`[Request Retry] 第 ${retryCount} 次重试`, {
            url: requestConfig.url,
            method: requestConfig.method,
            error: error.message,
        })
    },
})

// ==================== 全局 Loading 管理 ====================
/**
 * 全局 loading 计数器
 *
 * 为什么用计数器而不是布尔值？
 * - 支持多个并发请求
 * - 只有当所有请求都完成时，loading 才关闭
 *
 * 示例：
 * 请求1开始 → loadingCount: 0 → 1 → loading 显示
 * 请求2开始 → loadingCount: 1 → 2 → loading 继续显示
 * 请求1完成 → loadingCount: 2 → 1 → loading 继续显示
 * 请求2完成 → loadingCount: 1 → 0 → loading 关闭
 */
let loadingCount = 0

const setGlobalLoading = (loading: boolean) => {
    if (loading) {
        loadingCount++
    } else {
        loadingCount = Math.max(0, loadingCount - 1)
    }
    // 通过自定义事件通知 GlobalLoading 组件
    window.dispatchEvent(
        new CustomEvent('globalLoading', {
            detail: { loading: loadingCount > 0 },
        })
    )
}

// ==================== Token 刷新状态管理 ====================
// Token 刷新逻辑已经移到 TokenManager 中统一管理
// 包括：
// - 防止并发刷新
// - 多标签页同步
// - 过期前主动刷新
// - 等待队列处理

/**
 * 清除本地存储的 access token
 *
 * 注意：refresh token 在 HttpOnly Cookie 中，无法通过 JS 清除
 * 需要调用后端的 logout 接口来清除
 */
const clearTokens = () => {
    localStorage.removeItem('accessToken')
    // refreshToken 在 HttpOnly Cookie 中，无法直接清除
}

/**
 * 刷新 access token
 *
 * 流程：
 * 1. 调用后端 /auth/refresh 接口（refresh token 在 Cookie 中自动发送）
 * 2. 获取新的 access token
 * 3. 保存到 localStorage
 * 4. 返回新 token
 *
 * 注意：
 * - 使用原生 axios 而不是 request 实例，避免触发拦截器导致死循环
 * - refresh token 通过 HttpOnly Cookie 自动发送，无需手动传递
 * - 需要 withCredentials: true 以发送 Cookie
 */
const refreshAccessToken = async (): Promise<string> => {
    try {
        // 使用原生 axios.post，不使用 request
        // 原因：request 有拦截器，会导致死循环
        // refresh token 会通过 Cookie 自动发送
        const response = await axios.post('/api/auth/refresh', null, {
            withCredentials: true, // 允许发送 Cookie
        })

        const { access_token } = response.data.data
        localStorage.setItem('accessToken', access_token)
        return access_token
    } catch (error) {
        // 刷新失败，清除所有 token
        clearTokens()
        throw error
    }
}

// ==================== 请求拦截器 ====================
/**
 * 在每个请求发送前自动附加 access token 和处理 loading
 *
 * 功能：
 * 1. 附加 access token 到请求头
 * 2. 显示全局 loading（可配置）
 *
 * 认证流程：
 * 1. 从 localStorage 读取 access token
 * 2. 添加到请求头：Authorization: Bearer {token}
 * 3. 后端通过这个 token 识别用户身份
 *
 *  为什么用拦截器？
 * - 统一处理：不需要在每个 API 调用时手动添加 token
 * - 代码简洁：service 层只需关注业务逻辑
 * - 易于维护：token 格式变化时只改一处
 */
request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`
    }

    // 默认显示 loading，除非明确禁用
    const showLoading = config.headers?.['X-Show-Loading'] !== 'false'
    if (showLoading) {
        setGlobalLoading(true)
    }

    return config
})

// ==================== 响应拦截器 ====================
/**
 * 处理响应和错误，实现自动 token 刷新
 *
 *  完整流程图：
 *
 * 用户发起请求
 *     ↓
 * 附加 access token
 *     ↓
 * 后端返回 401（token 过期）
 *     ↓
 * ┌──────────────────────┐
 * │ 是否正在刷新 token？  │
 * └──────────────────────┘
 *     ↓ 否                    ↓ 是
 * 刷新 token            加入等待队列
 *     ↓                        ↓
 * 获取新 token          等待刷新完成
 *     ↓                        ↓
 * 更新请求头 ←──────────────────┘
 *     ↓
 * 重新发起请求
 *     ↓
 * 返回结果
 */
request.interceptors.response.use(
    // 成功响应处理
    response => {
        // 关闭 loading
        const showLoading = response.config.headers?.['X-Show-Loading'] !== 'false'
        if (showLoading) {
            setGlobalLoading(false)
        }

        // 自动显示成功 toast（如果配置了）
        const successMessage = response.config.headers?.['X-Success-Message']
        if (successMessage) {
            // 解码中文消息（header 中使用了 encodeURIComponent 编码）
            const decodedMessage = decodeURIComponent(successMessage as string)
            toast({
                title: decodedMessage,
            })
        }

        // 统一返回 response.data
        // 原因：后端返回格式统一为 { success, data, message }
        // 这样 service 层直接拿到 data，不需要再 .data.data
        return response.data
    },
    // 错误响应处理
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // 关闭 loading
        setGlobalLoading(false)

        // 自动提取错误消息并显示 toast
        const showErrorToast = originalRequest?.headers?.['X-Show-Error-Toast'] !== 'false'
        if (showErrorToast && error.response?.status !== 401) {
            // 401 错误有专门处理，不在这里显示 toast
            const errorMessage =
                (error.response?.data as any)?.message || (error.response?.data as any)?.error || error.message || '请求失败，请稍后重试'

            // 在控制台输出详细错误信息，方便调试
            console.error('[API Error]', {
                url: originalRequest?.url,
                method: originalRequest?.method,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: errorMessage,
                fullError: error,
            })

            toast({
                variant: 'destructive',
                title: '操作失败',
                description: errorMessage,
            })
        }

        // ========== 处理 401 错误（Token 过期） ==========
        // _retry 标记防止无限重试（如果刷新 token 后仍然 401）
        if (error.response?.status === 401 && !originalRequest._retry) {
            // 排除认证相关接口，这些接口不应该触发自动刷新
            // 原因：
            // 1. /auth/login 返回 401 表示登录失败，不应该尝试刷新 token
            // 2. /auth/refresh 返回 401 表示 refresh token 失效，不应该再次尝试刷新（避免死循环）
            const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh')

            // 如果是认证接口返回 401，直接返回错误，不触发刷新
            if (isAuthEndpoint) {
                return Promise.reject(error)
            }

            // 情况1：Token Manager 会处理并发刷新的情况
            // 如果有其他请求正在刷新，tokenManager.refreshToken() 会自动等待

            // 情况2：第一个遇到 401 的请求，负责刷新 token
            originalRequest._retry = true // 标记已重试，防止无限循环

            try {
                // 使用 Token Manager 刷新 token
                const newAccessToken = await tokenManager.refreshToken()

                // 更新原始请求的 token
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                }

                // 重新发起原始请求
                return request(originalRequest)
            } catch (refreshError) {
                // 刷新失败（refresh token 也过期了）

                // 在控制台输出详细错误信息
                console.error('[Token Refresh Failed]', {
                    message: '刷新 token 失败，即将跳转到登录页',
                    error: refreshError,
                })

                // 清除所有 token
                clearTokens()

                // 跳转到登录页
                window.location.href = '/account/login'

                return Promise.reject(refreshError)
            }
        }

        // 其他错误（非 401），直接抛出
        return Promise.reject(error)
    }
)
