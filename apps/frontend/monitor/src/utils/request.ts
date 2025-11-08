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

// ==================== Axios 实例配置 ====================
const config: CreateAxiosDefaults = {
    baseURL: '/api', // API 基础路径
    timeout: 5000, // 请求超时时间（5秒）
}

export const request = axios.create(config)

// ==================== Token 刷新状态管理 ====================
//  为什么需要这些变量？
//
// 场景：用户同时发起 3 个请求，access token 已过期
// 问题：如果不控制，会触发 3 次 token 刷新请求（浪费、可能失败）
//
// 解决方案：
// 1. isRefreshing: 标记是否正在刷新 token
// 2. failedQueue: 存储等待 token 刷新完成的请求
// 3. 第一个 401 触发刷新，其他请求进入队列等待
// 4. 刷新完成后，一起处理队列中的请求

let isRefreshing = false // 是否正在刷新 token
let failedQueue: Array<{
    resolve: (value?: unknown) => void
    reject: (reason?: any) => void
}> = [] // 等待队列

/**
 * 处理等待队列中的所有请求
 * @param error 如果有错误，所有请求都失败；否则重新发起请求
 */
const processQueue = (error: Error | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve() // 解决 Promise，请求会自动重试
        }
    })
    failedQueue = [] // 清空队列
}

/**
 * 清除本地存储的所有 token
 */
const clearTokens = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
}

/**
 * 刷新 access token
 *
 * 流程：
 * 1. 从 localStorage 获取 refresh token
 * 2. 调用后端 /auth/refresh 接口
 * 3. 获取新的 access token
 * 4. 保存到 localStorage
 * 5. 返回新 token
 *
 * 注意：
 * - 使用原生 axios 而不是 request 实例
 * - 避免触发拦截器导致死循环
 */
const refreshAccessToken = async (): Promise<string> => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
        throw new Error('No refresh token available')
    }

    try {
        // 使用原生 axios.post，不使用 request
        // 原因：request 有拦截器，会导致死循环
        const response = await axios.post('/api/auth/refresh', {
            refresh_token: refreshToken,
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
 * 在每个请求发送前自动附加 access token
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
        // 统一返回 response.data
        // 原因：后端返回格式统一为 { success, data, message }
        // 这样 service 层直接拿到 data，不需要再 .data.data
        return response.data
    },
    // 错误响应处理
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // ========== 处理 401 错误（Token 过期） ==========
        // _retry 标记防止无限重试（如果刷新 token 后仍然 401）
        if (error.response?.status === 401 && !originalRequest._retry) {
            // 情况1：已经有请求在刷新 token
            if (isRefreshing) {
                // Promise 队列模式：
                // 1. 创建一个新的 Promise
                // 2. 将 resolve/reject 存入队列
                // 3. 等待 token 刷新完成
                // 4. processQueue() 会调用所有的 resolve
                // 5. Promise 解决后，重新发起原始请求
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    .then(() => {
                        // Token 刷新成功，重新发起请求
                        return request(originalRequest)
                    })
                    .catch(err => {
                        // Token 刷新失败，返回错误
                        return Promise.reject(err)
                    })
            }

            // 情况2：第一个遇到 401 的请求，负责刷新 token
            originalRequest._retry = true // 标记已重试，防止无限循环
            isRefreshing = true // 标记正在刷新

            try {
                // 刷新 access token
                const newAccessToken = await refreshAccessToken()

                // 更新原始请求的 token
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                }

                // 刷新成功，处理等待队列中的所有请求
                processQueue(null)

                // 重新发起原始请求
                return request(originalRequest)
            } catch (refreshError) {
                // 刷新失败（refresh token 也过期了）

                // 通知所有等待的请求失败
                processQueue(refreshError as Error)

                // 清除所有 token
                clearTokens()

                // 跳转到登录页
                window.location.href = '/account/login'

                return Promise.reject(refreshError)
            } finally {
                // 无论成功失败，都重置刷新标记
                isRefreshing = false
            }
        }

        // 其他错误（非 401），直接抛出
        return Promise.reject(error)
    }
)
