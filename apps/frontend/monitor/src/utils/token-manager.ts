/**
 * Token 管理器
 *
 * 功能：
 * - 统一管理 token 刷新逻辑
 * - 支持多标签页同步
 * - 防止并发刷新
 * - 处理 token 过期前的主动刷新
 */

import axios from 'axios'

import { TokenRefreshScheduler } from './token-refresh-scheduler.ts'

interface TokenRefreshResult {
    access_token: string
    expires_in: number
}

export class TokenManager {
    private static instance: TokenManager
    private isRefreshing = false
    private failedQueue: Array<{
        resolve: (value?: any) => void
        reject: (reason?: any) => void
    }> = []
    private refreshScheduler: TokenRefreshScheduler
    private channel: BroadcastChannel | null = null

    private constructor() {
        this.refreshScheduler = new TokenRefreshScheduler(this)
        this.initBroadcastChannel()
    }

    /**
     * 获取单例实例
     */
    static getInstance(): TokenManager {
        if (!TokenManager.instance) {
            TokenManager.instance = new TokenManager()
        }
        return TokenManager.instance
    }

    /**
     * 初始化跨标签页通信
     */
    private initBroadcastChannel() {
        // 检查浏览器是否支持 BroadcastChannel
        if (typeof BroadcastChannel !== 'undefined') {
            this.channel = new BroadcastChannel('sky_monitor_auth')

            this.channel.onmessage = event => {
                switch (event.data.type) {
                    case 'TOKEN_REFRESHED':
                        // 其他标签页刷新了 token
                        this.handleTokenRefreshed(event.data.token, event.data.expiresIn)
                        break
                    case 'TOKEN_REFRESH_FAILED':
                        // 其他标签页刷新失败
                        this.handleTokenRefreshFailed(event.data.error)
                        break
                    case 'LOGOUT':
                        // 其他标签页登出
                        this.handleLogout()
                        break
                }
            }
        }
    }

    /**
     * 刷新 access token
     */
    async refreshToken(): Promise<string> {
        // 如果正在刷新，加入队列等待
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject })
            })
        }

        this.isRefreshing = true

        try {
            // 调用后端刷新接口
            const response = await axios.post<{ success: boolean; data: TokenRefreshResult }>('/api/auth/refresh', null, {
                withCredentials: true, // 携带 Cookie
            })

            const { access_token, expires_in } = response.data.data

            // 保存新 token
            localStorage.setItem('accessToken', access_token)

            // 通知其他标签页
            this.broadcast('TOKEN_REFRESHED', {
                token: access_token,
                expiresIn: expires_in,
            })

            // 安排下次刷新
            this.refreshScheduler.scheduleRefresh(expires_in)

            // 处理等待队列
            this.processQueue(null, access_token)

            return access_token
        } catch (error) {
            // 通知其他标签页刷新失败
            const errorMessage = error instanceof Error ? error.message : String(error)
            this.broadcast('TOKEN_REFRESH_FAILED', { error: errorMessage })

            // 处理等待队列
            this.processQueue(error as Error)

            throw error
        } finally {
            this.isRefreshing = false
        }
    }

    /**
     * 处理等待队列
     */
    private processQueue(error: Error | null, token?: string) {
        this.failedQueue.forEach(prom => {
            if (error) {
                prom.reject(error)
            } else {
                prom.resolve(token)
            }
        })
        this.failedQueue = []
    }

    /**
     * 处理其他标签页刷新成功
     */
    private handleTokenRefreshed(token: string, expiresIn: number) {
        localStorage.setItem('accessToken', token)
        this.refreshScheduler.scheduleRefresh(expiresIn)
        this.processQueue(null, token)
    }

    /**
     * 处理其他标签页刷新失败
     */
    private handleTokenRefreshFailed(error: string) {
        this.processQueue(new Error(error))
    }

    /**
     * 处理登出
     */
    private handleLogout() {
        localStorage.removeItem('accessToken')
        this.refreshScheduler.clearSchedule()
        window.location.href = '/account/login'
    }

    /**
     * 主动登出
     */
    logout() {
        this.broadcast('LOGOUT', {})
        this.handleLogout()
    }

    /**
     * 登录成功后初始化
     */
    onLogin(accessToken: string, expiresIn: number) {
        localStorage.setItem('accessToken', accessToken)
        this.refreshScheduler.scheduleRefresh(expiresIn)
    }

    /**
     * 广播消息到其他标签页
     */
    private broadcast(type: string, data: any) {
        if (this.channel) {
            this.channel.postMessage({ type, ...data })
        }
    }

    /**
     * 清理资源
     */
    dispose() {
        this.refreshScheduler.clearSchedule()
        if (this.channel) {
            this.channel.close()
            this.channel = null
        }
    }
}

// 导出单例实例
export const tokenManager = TokenManager.getInstance()
