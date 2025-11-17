/**
 * 路由配置
 */

import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthGuard, GuestGuard } from './guards'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageLoading } from '@/components/loading/PageLoading'
import { ROUTES } from '@/utils/constants'
import ErrorBoundary from '@/components/ErrorBoundary'

// 懒加载页面组件
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const ProjectsPage = lazy(() => import('@/pages/projects/ProjectsPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const EventsPage = lazy(() => import('@/pages/events/EventsPage'))
const EventDetailPage = lazy(() => import('@/pages/events/EventDetailPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))
const NotFoundPage = lazy(() => import('@/pages/error/NotFoundPage'))

/**
 * 懒加载包装组件
 */
function LazyPage({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            <Suspense fallback={<PageLoading />}>{children}</Suspense>
        </ErrorBoundary>
    )
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
        errorElement: (
            <Suspense fallback={<PageLoading />}>
                <NotFoundPage />
            </Suspense>
        ),
    },
    {
        path: '/auth/reset-password',
        element: (
            <GuestGuard>
                <LazyPage>
                    <ResetPasswordPage />
                </LazyPage>
            </GuestGuard>
        ),
        errorElement: (
            <Suspense fallback={<PageLoading />}>
                <NotFoundPage />
            </Suspense>
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
        errorElement: (
            <Suspense fallback={<PageLoading />}>
                <NotFoundPage />
            </Suspense>
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

            // 事件详情
            {
                path: ROUTES.EVENT_DETAIL,
                element: (
                    <LazyPage>
                        <EventDetailPage />
                    </LazyPage>
                ),
            },

            // 个人资料
            {
                path: ROUTES.PROFILE,
                element: (
                    <LazyPage>
                        <ProfilePage />
                    </LazyPage>
                ),
            },
        ],
    },
])
