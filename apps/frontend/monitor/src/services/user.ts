import { CurrentUserRes, LoginPayload, LoginRes } from '@/types/api'
import { request } from '@/utils/request'
import { configureRequest } from '@/utils/request-config'
import { tokenManager } from '@/utils/token-manager'

/**
 * 用户登录
 *
 * 配置说明：
 *   - 显示成功 toast：登录成功时自动提示
 *   - 默认显示 loading 和错误 toast
 *
 * 安全说明：
 *   - Access Token 存储在 localStorage（短期，15分钟）
 *   - Refresh Token 通过 HttpOnly Cookie 设置（长期，7天）
 *
 * @param data
 * @returns
 */
export const login = async (data: LoginPayload): Promise<LoginRes> => {
    const result = await request.post('/auth/login', data, {
        headers: configureRequest({
            showSuccessToast: true,
            successMessage: '登录成功',
        }),
    })

    // 使用 Token Manager 管理 token
    if (result.data?.access_token) {
        tokenManager.onLogin(result.data.access_token, result.data.expires_in || 900)
    }

    // refresh token 已经通过 HttpOnly Cookie 自动设置，无需手动处理

    return result
}

/**
 * 获取当前用户信息
 *
 * 配置说明：
 * - 静默请求：不显示 loading 和错误 toast
 * - 适用于轮询或后台请求
 *
 * @returns
 */
export const currentUser = async (): Promise<CurrentUserRes> => {
    return await request.get('/currentUser', {
        headers: configureRequest({
            showLoading: false,
            showErrorToast: false,
        }),
    })
}

/**
 * 用户注册
 *
 * 配置说明：
 * - 显示成功 toast：注册成功时自动提示
 * - 默认显示 loading 和错误 toast
 *
 * @param data
 * @returns
 */
export const register = async (data: { username: string; password: string }) => {
    return await request.post('/admin/register', data, {
        headers: configureRequest({
            showSuccessToast: true,
            successMessage: '注册成功，请前往登录',
        }),
    })
}

/**
 * 用户退出登录
 *
 * 配置说明：
 * - 显示成功 toast：登出成功时自动提示
 * - 默认显示 loading 和错误 toast
 *
 * 安全说明：
 * - 清除 localStorage 中的 Access Token
 * - 后端会清除 HttpOnly Cookie 中的 Refresh Token
 *
 * @returns
 */
export const logout = async () => {
    try {
        const result = await request.post('/auth/logout', null, {
            headers: configureRequest({
                showSuccessToast: true,
                successMessage: '退出成功',
            }),
        })
        return result
    } finally {
        // 使用 Token Manager 处理登出
        tokenManager.logout()
        // refreshToken 在 Cookie 中，由后端清除
    }
}

/**
 * 刷新 access token
 *
 * 注意：此函数通常不需要直接调用
 * request.ts 的拦截器会自动处理 token 刷新
 *
 * @returns 新的 access_token
 */
export const refreshAccessToken = async () => {
    // refresh token 通过 Cookie 自动发送
    return await request.post('/auth/refresh', null)
}
