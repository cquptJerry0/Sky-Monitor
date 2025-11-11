/**
 * Token 刷新调度器
 *
 * 功能：
 * - 在 token 过期前主动刷新
 * - 管理刷新定时器
 * - 避免过期后用户体验中断
 */

export class TokenRefreshScheduler {
    private refreshTimer: NodeJS.Timeout | null = null
    private tokenManager: any // 避免循环依赖

    constructor(tokenManager: any) {
        this.tokenManager = tokenManager
    }

    /**
     * 安排 token 刷新
     *
     * @param expiresIn 过期时间（秒）
     */
    scheduleRefresh(expiresIn: number) {
        this.clearSchedule()

        // 计算刷新时间：在过期前 2 分钟刷新
        // 如果过期时间小于 3 分钟，则在过期时间的 80% 时刷新
        let refreshTime: number
        const minRefreshBuffer = 120 * 1000 // 2 分钟（毫秒）
        const expiresInMs = expiresIn * 1000

        if (expiresInMs > minRefreshBuffer * 2) {
            // 过期时间大于 4 分钟，提前 2 分钟刷新
            refreshTime = expiresInMs - minRefreshBuffer
        } else {
            // 过期时间较短，在 80% 时刷新
            refreshTime = expiresInMs * 0.8
        }

        // 确保刷新时间为正数
        refreshTime = Math.max(refreshTime, 0)

        if (refreshTime > 0) {
            console.log(`[Token Scheduler] 已安排 token 刷新，将在 ${Math.round(refreshTime / 1000)} 秒后执行`)

            this.refreshTimer = setTimeout(async () => {
                try {
                    console.log('[Token Scheduler] 开始自动刷新 token')
                    await this.tokenManager.refreshToken()
                    console.log('[Token Scheduler] token 刷新成功')
                } catch (error) {
                    console.error('[Token Scheduler] token 刷新失败:', error)
                    // 刷新失败不影响用户继续操作
                    // 等待用户下次请求时触发拦截器刷新
                }
            }, refreshTime)
        }
    }

    /**
     * 清除刷新计划
     */
    clearSchedule() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer)
            this.refreshTimer = null
            console.log('[Token Scheduler] 已清除刷新计划')
        }
    }

    /**
     * 获取下次刷新时间（用于调试）
     */
    getNextRefreshTime(): Date | null {
        if (!this.refreshTimer) {
            return null
        }
        // 注意：无法准确获取 setTimeout 的剩余时间
        // 这里只是返回一个估算值
        return new Date()
    }
}
