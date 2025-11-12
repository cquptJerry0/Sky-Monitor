/**
 * UI 状态管理
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
    // 侧边栏
    sidebarCollapsed: boolean
    toggleSidebar: () => void
    setSidebarCollapsed: (collapsed: boolean) => void

    // 全局 Loading
    globalLoading: boolean
    setGlobalLoading: (loading: boolean) => void

    // 主题
    theme: 'dark' | 'light'
    setTheme: (theme: 'dark' | 'light') => void
    toggleTheme: () => void
}

/**
 * UI 状态 Store
 *
 * 管理 UI 相关的状态（侧边栏、Loading、主题等）
 */
export const useUIStore = create<UIState>()(
    persist(
        (set, get) => ({
            // 初始状态
            sidebarCollapsed: false,
            globalLoading: false,
            theme: 'dark',

            // 切换侧边栏
            toggleSidebar: () => {
                set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }))
            },

            // 设置侧边栏状态
            setSidebarCollapsed: (collapsed: boolean) => {
                set({ sidebarCollapsed: collapsed })
            },

            // 设置全局 Loading
            setGlobalLoading: (loading: boolean) => {
                set({ globalLoading: loading })
            },

            // 设置主题
            setTheme: (theme: 'dark' | 'light') => {
                set({ theme })
                // 更新 HTML 根元素的 class
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
            },

            // 切换主题
            toggleTheme: () => {
                const currentTheme = get().theme
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
                get().setTheme(newTheme)
            },
        }),
        {
            name: 'ui-storage',
            // 持久化侧边栏和主题状态
            partialize: state => ({
                sidebarCollapsed: state.sidebarCollapsed,
                theme: state.theme,
            }),
            // 恢复状态后应用主题
            onRehydrateStorage: () => state => {
                if (state?.theme === 'dark') {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
            },
        }
    )
)
