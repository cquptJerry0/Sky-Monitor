import React, { createContext, useContext, useState, type ReactNode } from 'react'

interface AppContextType {
    appId: string
    setAppId: (id: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appId, setAppId] = useState('reactddthD9')

    return <AppContext.Provider value={{ appId, setAppId }}>{children}</AppContext.Provider>
}

export const useApp = () => {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error('useApp must be used within AppProvider')
    }
    return context
}
