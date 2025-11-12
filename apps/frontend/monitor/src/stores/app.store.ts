/**
 * 应用全局状态管理
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
    // 当前选中的应用
    currentAppId: string | null
    setCurrentAppId: (appId: string | null) => void

    // 时间范围
    timeRange: { start: Date; end: Date }
    setTimeRange: (range: { start: Date; end: Date }) => void

    // 重置时间范围为默认值（最近 24 小时）
    resetTimeRange: () => void
}

/**
 * 应用全局状态 Store
 *
 * 管理当前选中的应用和时间范围
 */
export const useAppStore = create<AppState>()(
    persist(
        set => ({
            // 初始状态
            currentAppId: null,

            timeRange: {
                start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 小时前
                end: new Date(),
            },

            // 设置当前应用
            setCurrentAppId: (appId: string | null) => {
                set({ currentAppId: appId })
            },

            // 设置时间范围
            setTimeRange: (range: { start: Date; end: Date }) => {
                set({ timeRange: range })
            },

            // 重置时间范围
            resetTimeRange: () => {
                set({
                    timeRange: {
                        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
                        end: new Date(),
                    },
                })
            },
        }),
        {
            name: 'app-storage',
            // 只持久化 currentAppId
            partialize: state => ({
                currentAppId: state.currentAppId,
            }),
        }
    )
)
