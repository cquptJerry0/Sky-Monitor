import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SdkConfigStore {
    errorSampleRate: number
    performanceSampleRate: number
    sessionReplaySampleRate: number
    enableErrorMonitoring: boolean
    enablePerformanceMonitoring: boolean
    enableSessionReplay: boolean
    setErrorSampleRate: (rate: number) => void
    setPerformanceSampleRate: (rate: number) => void
    setSessionReplaySampleRate: (rate: number) => void
    setEnableErrorMonitoring: (enabled: boolean) => void
    setEnablePerformanceMonitoring: (enabled: boolean) => void
    setEnableSessionReplay: (enabled: boolean) => void
}

export const useSdkConfigStore = create<SdkConfigStore>()(
    persist(
        set => ({
            errorSampleRate: 100,
            performanceSampleRate: 100,
            sessionReplaySampleRate: 100,
            enableErrorMonitoring: true,
            enablePerformanceMonitoring: true,
            enableSessionReplay: true,

            setErrorSampleRate: rate => set({ errorSampleRate: rate }),
            setPerformanceSampleRate: rate => set({ performanceSampleRate: rate }),
            setSessionReplaySampleRate: rate => set({ sessionReplaySampleRate: rate }),
            setEnableErrorMonitoring: enabled => set({ enableErrorMonitoring: enabled }),
            setEnablePerformanceMonitoring: enabled => set({ enablePerformanceMonitoring: enabled }),
            setEnableSessionReplay: enabled => set({ enableSessionReplay: enabled }),
        }),
        {
            name: 'sdk-config-storage',
        }
    )
)
