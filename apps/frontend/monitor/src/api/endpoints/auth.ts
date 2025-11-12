/**
 * 认证相关 API
 */

import { client } from '../client'
import type { User } from '../types'

export const authAPI = {
    /**
     * 登录
     */
    login: (username: string, password: string) =>
        client.post<{ access_token: string; expires_in: number }>('/auth/login', {
            username,
            password,
        }),

    /**
     * 刷新 Token
     */
    refresh: () => client.post<{ access_token: string; expires_in: number }>('/auth/refresh'),

    /**
     * 登出
     */
    logout: () => client.post('/auth/logout'),

    /**
     * 登出所有设备
     */
    logoutAll: () => client.post('/auth/logout-all'),

    /**
     * 获取当前用户信息
     */
    getCurrentUser: () => client.get<User>('/currentUser'),

    /**
     * 获取用户资料
     */
    getProfile: () => client.get<User>('/me'),
}
