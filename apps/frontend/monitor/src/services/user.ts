import { CurrentUserRes, LoginPayload, LoginRes } from '@/types/api'
import { request } from '@/utils/request'
import { configureRequest } from '@/utils/request-config'

/**
 * 用户登录
 *
 * 配置说明：
 * - 显示成功 toast：登录成功时自动提示
 * - 默认显示 loading 和错误 toast
 *
 * @param data
 * @returns
 */
export const login = async (data: LoginPayload): Promise<LoginRes> => {
    return await request.post('/auth/login', data, {
        headers: configureRequest({
            showSuccessToast: true,
            successMessage: '登录成功',
        }),
    })
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
 * @returns
 */
export const logout = async () => {
    const result = await request.post('/auth/logout', null, {
        headers: configureRequest({
            showSuccessToast: true,
            successMessage: '退出成功',
        }),
    })
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    return result
}

/**
 * 刷新access token
 * @param refreshToken
 * @returns
 */
export const refreshToken = async (refreshToken: string) => {
    return await request.post('/auth/refresh', { refresh_token: refreshToken })
}
