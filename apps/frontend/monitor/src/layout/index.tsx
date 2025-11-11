import { Outlet } from 'react-router-dom'

import { GlobalLoading } from '@/components/GlobalLoading'
import { Aside } from '@/components/LayoutAside/Aside'

export function Layout() {
    return (
        <>
            <GlobalLoading />
            <div className="grid h-screen w-full grid-cols-[280px_1fr]">
                <Aside />
                <div className="flex flex-col overflow-y-auto relative">
                    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </>
    )
}
