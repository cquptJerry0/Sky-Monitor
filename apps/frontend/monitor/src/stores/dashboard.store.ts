import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * 时间范围类型
 */
export interface TimeRange {
    start: Date
    end: Date
}

/**
 * 时间范围预设
 */
export type TimeRangePreset = 'last_15m' | 'last_1h' | 'last_6h' | 'last_24h' | 'last_7d' | 'last_30d' | 'custom'

/**
 * Dashboard Store State
 */
interface DashboardState {
    // 全局时间范围
    timeRange: TimeRange
    timeRangePreset: TimeRangePreset

    // 当前 Dashboard ID
    currentDashboardId: string | null

    // 是否自动刷新
    autoRefresh: boolean
    autoRefreshInterval: number // 秒

    // Actions
    setTimeRange: (timeRange: TimeRange, preset?: TimeRangePreset) => void
    setTimeRangePreset: (preset: TimeRangePreset) => void
    setCurrentDashboardId: (dashboardId: string | null) => void
    setAutoRefresh: (enabled: boolean) => void
    setAutoRefreshInterval: (interval: number) => void
    resetTimeRange: () => void
}

/**
 * 获取预设时间范围
 */
export function getPresetTimeRange(preset: TimeRangePreset): TimeRange {
    const now = new Date()
    const start = new Date()

    switch (preset) {
        case 'last_15m':
            start.setMinutes(now.getMinutes() - 15)
            break
        case 'last_1h':
            start.setHours(now.getHours() - 1)
            break
        case 'last_6h':
            start.setHours(now.getHours() - 6)
            break
        case 'last_24h':
            start.setHours(now.getHours() - 24)
            break
        case 'last_7d':
            start.setDate(now.getDate() - 7)
            break
        case 'last_30d':
            start.setDate(now.getDate() - 30)
            break
        case 'custom':
            // 自定义时间范围,返回最近 24 小时作为默认值
            start.setHours(now.getHours() - 24)
            break
    }

    return { start, end: now }
}

/**
 * Dashboard Store
 */
export const useDashboardStore = create<DashboardState>()(
    devtools(
        set => ({
            // 默认值: 最近 24 小时
            timeRange: getPresetTimeRange('last_24h'),
            timeRangePreset: 'last_24h',
            currentDashboardId: null,
            autoRefresh: false,
            autoRefreshInterval: 30,

            // Actions
            setTimeRange: (timeRange, preset = 'custom') => set({ timeRange, timeRangePreset: preset }, false, 'setTimeRange'),

            setTimeRangePreset: preset =>
                set({ timeRange: getPresetTimeRange(preset), timeRangePreset: preset }, false, 'setTimeRangePreset'),

            setCurrentDashboardId: dashboardId => set({ currentDashboardId: dashboardId }, false, 'setCurrentDashboardId'),

            setAutoRefresh: enabled => set({ autoRefresh: enabled }, false, 'setAutoRefresh'),

            setAutoRefreshInterval: interval => set({ autoRefreshInterval: interval }, false, 'setAutoRefreshInterval'),

            resetTimeRange: () =>
                set(
                    {
                        timeRange: getPresetTimeRange('last_24h'),
                        timeRangePreset: 'last_24h',
                    },
                    false,
                    'resetTimeRange'
                ),
        }),
        { name: 'DashboardStore' }
    )
)
