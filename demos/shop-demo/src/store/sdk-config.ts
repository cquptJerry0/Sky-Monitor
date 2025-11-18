import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SdkConfigStore {
    enableErrorMonitoring: boolean
    enablePerformanceMonitoring: boolean
    enableSessionReplay: boolean
    setEnableErrorMonitoring: (enabled: boolean) => void
    setEnablePerformanceMonitoring: (enabled: boolean) => void
    setEnableSessionReplay: (enabled: boolean) => void
}

export const useSdkConfigStore = create<SdkConfigStore>()(
    persist(
        set => ({
            enableErrorMonitoring: true,
            enablePerformanceMonitoring: true,
            enableSessionReplay: true,

            setEnableErrorMonitoring: enabled => set({ enableErrorMonitoring: enabled }),
            setEnablePerformanceMonitoring: enabled => set({ enablePerformanceMonitoring: enabled }),
            setEnableSessionReplay: enabled => set({ enableSessionReplay: enabled }),
        }),
        {
            name: 'sdk-config-storage',
            storage: {
                getItem: name => {
                    const str = sessionStorage.getItem(name)
                    return str ? JSON.parse(str) : null
                },
                setItem: (name, value) => {
                    sessionStorage.setItem(name, JSON.stringify(value))
                },
                removeItem: name => sessionStorage.removeItem(name),
            },
        }
    )
)
