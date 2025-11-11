import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApplicationData } from '@/types/api'
import * as srv from '@/services'

interface AppContextValue {
    currentAppId: string | null
    setCurrentAppId: (appId: string | null) => void
    applications: ApplicationData[]
    isLoading: boolean
    refetchApplications: () => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
    const [currentAppId, setCurrentAppId] = useState<string | null>(() => {
        // 从 localStorage 恢复上次选择的应用
        return localStorage.getItem('selectedAppId')
    })

    const {
        data: applicationsRes,
        isLoading,
        refetch: refetchApplications,
    } = useQuery({
        queryKey: ['applications'],
        queryFn: srv.fetchApplicationList,
        staleTime: 5 * 60 * 1000, // 5分钟缓存
    })

    const applications = applicationsRes?.data?.applications || []

    // 保存选择到 localStorage
    useEffect(() => {
        if (currentAppId) {
            localStorage.setItem('selectedAppId', currentAppId)
        } else {
            localStorage.removeItem('selectedAppId')
        }
    }, [currentAppId])

    // 自动选择第一个应用
    useEffect(() => {
        if (!currentAppId && applications.length > 0 && applications[0]) {
            setCurrentAppId(applications[0].appId)
        }
    }, [applications, currentAppId])

    const value: AppContextValue = {
        currentAppId,
        setCurrentAppId,
        applications,
        isLoading,
        refetchApplications,
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
    const context = useContext(AppContext)
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider')
    }
    return context
}
