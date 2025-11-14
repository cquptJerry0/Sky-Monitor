/**
 * 应用主布局
 */

import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useUIStore } from '@/stores/ui.store'

export function AppLayout() {
    const sidebarCollapsed = useUIStore(state => state.sidebarCollapsed)

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* 侧边栏 */}
            <Sidebar collapsed={sidebarCollapsed} />

            {/* 主内容区 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* 顶部栏 */}
                <Header />

                {/* 页面内容 */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
