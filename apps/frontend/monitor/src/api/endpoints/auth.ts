/**
 * 认证相关 API
 */

import { client } from '../client'
import type { User } from '../types'

export const authAPI = {
    /**
     * 登录
     * 后端返回: { success: true, data: { access_token: string, expires_in: number } }
     * 响应拦截器解包后: { access_token: string, expires_in: number }
     */
    login: (username: string, password: string) =>
        client.post<{ access_token: string; expires_in: number }>('/auth/login', {
            username,
            password,
        }),

    /**
     * 刷新 Token
     * 后端返回: { success: true, data: { access_token: string, expires_in: number } }
     * 响应拦截器解包后: { access_token: string, expires_in: number }
     */
    refresh: () => client.post<{ access_token: string; expires_in: number }>('/auth/refresh'),

    /**
     * 登出
     * 后端返回: { success: true, data: null }
     * 响应拦截器解包后: null
     */
    logout: () => client.post<null>('/auth/logout'),

    /**
     * 登出所有设备
     * 后端返回: { success: true, data: null }
     * 响应拦截器解包后: null
     */
    logoutAll: () => client.post<null>('/auth/logout-all'),

    /**
     * 获取当前用户信息
     * 后端返回: { success: true, data: User }
     * 响应拦截器解包后: User
     */
    getCurrentUser: () => client.get<User>('/currentUser'),

    /**
     * 获取用户资料
     * 后端返回: { success: true, data: User }
     * 响应拦截器解包后: User
     */
    getProfile: () => client.get<User>('/me'),

    /**
     * 注册
     * 后端返回: { success: true, data: User }
     * 响应拦截器解包后: User
     */
    register: (data: { username: string; password: string; email?: string; phone?: string }) => client.post<User>('/admin/register', data),

    /**
     * 修改邮箱
     * 后端返回: { success: true, data: User }
     * 响应拦截器解包后: User
     */
    updateEmail: (email: string) => client.put<User>('/profile/email', { email }),

    /**
     * 修改密码
     * 后端返回: { success: true, data: User }
     * 响应拦截器解包后: User
     */
    updatePassword: (currentPassword: string, newPassword: string) =>
        client.put<User>('/profile/password', { currentPassword, newPassword }),

    /**
     * 修改头像
     * 后端返回: { success: true, data: User }
     * 响应拦截器解包后: User
     */
    updateAvatar: (avatar: string) => client.put<User>('/profile/avatar', { avatar }),

    /**
     * 上传头像文件
     * 后端返回: { success: true, data: { user: User, url: string } }
     * 响应拦截器解包后: { user: User, url: string }
     */
    uploadAvatar: (file: File) => {
        const formData = new FormData()
        formData.append('file', file)
        return client.post<{ user: User; url: string }>('/profile/avatar/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },

    /**
     * 忘记密码 - 发送重置邮件
     * 后端返回: { success: true, message: string }
     */
    forgotPassword: (email: string) => client.post<{ message: string }>('/auth/forgot-password', { email }),

    /**
     * 重置密码
     * 后端返回: { success: true, message: string }
     */
    resetPassword: (token: string, newPassword: string) => client.post<{ message: string }>('/auth/reset-password', { token, newPassword }),
}
