import { useLayoutEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { Aside } from '@/components/LayoutAside/Aside'

export function Layout() {
    useLayoutEffect(() => {
        if (!localStorage.getItem('token')) {
            window.location.href = `/account/login?redirect=${window.location.pathname}`
        }
    }, [])
    return (
        <div className="grid h-screen w-full grid-cols-[280px_1fr]">
            <Aside />
            <div className="flex flex-col overflow-y-auto relative">
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
