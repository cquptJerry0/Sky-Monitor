/**
 * 当前应用相关 Hook
 */

import { useAppStore } from '@/stores/app.store'

/**
 * 获取当前应用 ID
 */
export function useCurrentApp() {
    return useAppStore(state => state.currentAppId)
}

/**
 * 设置当前应用 ID
 */
export function useSetCurrentApp() {
    return useAppStore(state => state.setCurrentAppId)
}

/**
 * 获取时间范围
 */
export function useTimeRange() {
    return useAppStore(state => state.timeRange)
}

/**
 * 设置时间范围
 */
export function useSetTimeRange() {
    return useAppStore(state => state.setTimeRange)
}

/**
 * 重置时间范围
 */
export function useResetTimeRange() {
    return useAppStore(state => state.resetTimeRange)
}
