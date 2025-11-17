import React, { createContext, useContext, useState, type ReactNode } from 'react'

interface AppContextType {
    appId: string
    setAppId: (id: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 从 URL 参数读取 appId,如果没有则使用默认值
    const urlParams = new URLSearchParams(window.location.search)
    const initialAppId = urlParams.get('appId') || 'vanilla1bhOoq'

    const [appId, setAppId] = useState(initialAppId)

    return <AppContext.Provider value={{ appId, setAppId }}>{children}</AppContext.Provider>
}

export const useApp = () => {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error('useApp must be used within AppProvider')
    }
    return context
}
