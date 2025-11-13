import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import { AppContent } from './components/AppContent'
import { PerformanceTestPage } from './pages/PerformanceTestPage'

function App() {
    return (
        <AppProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<AppContent />} />
                    <Route path="/performance" element={<PerformanceTestPage />} />
                </Routes>
            </BrowserRouter>
        </AppProvider>
    )
}

export default App
