import './App.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { setDefaultOptions } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { RouterProvider } from 'react-router-dom'

import { Toaster } from './components/ui/toaster'
import { AppProvider } from './contexts/AppContext'
import { router } from './router'
import { queryClient } from './utils/query-client'

setDefaultOptions({
    locale: zhCN,
})

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AppProvider>
                <Toaster />
                <RouterProvider router={router} />
            </AppProvider>
        </QueryClientProvider>
    )
}

export default App
