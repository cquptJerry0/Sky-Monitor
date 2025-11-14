/**
 * 路由配置
 */

import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthGuard, GuestGuard } from './guards'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageLoading } from '@/components/loading/PageLoading'
import { ROUTES } from '@/utils/constants'

// 懒加载页面组件
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const ProjectsPage = lazy(() => import('@/pages/projects/ProjectsPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/NewDashboardPage'))
const EventsPage = lazy(() => import('@/pages/events/EventsPage'))

/**
 * 懒加载包装组件
 */
function LazyPage({ children }: { children: React.ReactNode }) {
    return <Suspense fallback={<PageLoading />}>{children}</Suspense>
}

/**
 * 路由配置
 */
export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
    // 登录页
    {
        path: ROUTES.LOGIN,
        element: (
            <GuestGuard>
                <LazyPage>
                    <LoginPage />
                </LazyPage>
            </GuestGuard>
        ),
    },

    // 主应用
    {
        path: '/',
        element: (
            <AuthGuard>
                <AppLayout />
            </AuthGuard>
        ),
        children: [
            // 默认重定向到应用列表
            {
                index: true,
                element: <Navigate to={ROUTES.PROJECTS} replace />,
            },

            // 应用列表
            {
                path: ROUTES.PROJECTS,
                element: (
                    <LazyPage>
                        <ProjectsPage />
                    </LazyPage>
                ),
            },

            // 仪表盘
            {
                path: ROUTES.DASHBOARD,
                element: (
                    <LazyPage>
                        <DashboardPage />
                    </LazyPage>
                ),
            },

            // 事件监控
            {
                path: ROUTES.EVENTS,
                element: (
                    <LazyPage>
                        <EventsPage />
                    </LazyPage>
                ),
            },
        ],
    },
])
