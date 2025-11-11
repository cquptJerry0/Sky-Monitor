import { Outlet } from 'react-router-dom'
import { GlobalLoading } from '@/components/GlobalLoading'
import { Aside } from '../LayoutAside/Aside'
import { Header } from '../Header'

export function Layout() {
    return (
        <>
            <GlobalLoading />
            <div className="flex h-screen overflow-hidden">
                {/* 左侧边栏 */}
                <div className="w-64 flex-shrink-0">
                    <Aside />
                </div>

                {/* 右侧主体 */}
                <div className="flex-1 flex flex-col">
                    {/* 顶部栏 */}
                    <Header />

                    {/* 主内容区 */}
                    <main className="flex-1 overflow-auto bg-muted/10">
                        <Outlet />
                    </main>
                </div>
            </div>
        </>
    )
}
