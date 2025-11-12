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
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const ErrorsPage = lazy(() => import('@/pages/errors/ErrorsPage'))
const ErrorGroupsPage = lazy(() => import('@/pages/errors/ErrorGroupsPage'))
const PerformancePage = lazy(() => import('@/pages/performance/PerformancePage'))
const WebVitalsPage = lazy(() => import('@/pages/performance/WebVitalsPage'))
const SlowRequestsPage = lazy(() => import('@/pages/performance/SlowRequestsPage'))
const ResourceTimingPage = lazy(() => import('@/pages/performance/ResourceTimingPage'))
const HttpErrorsPage = lazy(() => import('@/pages/integrations/HttpErrorsPage'))
const ResourceErrorsPage = lazy(() => import('@/pages/integrations/ResourceErrorsPage'))
const SessionsPage = lazy(() => import('@/pages/sessions/SessionsPage'))
const SessionReplayPage = lazy(() => import('@/pages/sessions/SessionReplayPage'))
const AlertsPage = lazy(() => import('@/pages/alerts/AlertsPage'))
const AlertConfigPage = lazy(() => import('@/pages/alerts/AlertConfigPage'))

/**
 * 懒加载包装组件
 */
function LazyPage({ children }: { children: React.ReactNode }) {
    return <Suspense fallback={<PageLoading />}>{children}</Suspense>
}

/**
 * 路由配置
 */
export const router = createBrowserRouter([
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

            // 错误监控
            {
                path: ROUTES.ERRORS,
                element: (
                    <LazyPage>
                        <ErrorsPage />
                    </LazyPage>
                ),
            },
            {
                path: ROUTES.ERROR_GROUPS,
                element: (
                    <LazyPage>
                        <ErrorGroupsPage />
                    </LazyPage>
                ),
            },

            // 性能监控
            {
                path: ROUTES.PERFORMANCE,
                element: (
                    <LazyPage>
                        <PerformancePage />
                    </LazyPage>
                ),
            },
            {
                path: ROUTES.WEB_VITALS,
                element: (
                    <LazyPage>
                        <WebVitalsPage />
                    </LazyPage>
                ),
            },
            {
                path: ROUTES.SLOW_REQUESTS,
                element: (
                    <LazyPage>
                        <SlowRequestsPage />
                    </LazyPage>
                ),
            },
            {
                path: ROUTES.RESOURCE_TIMING,
                element: (
                    <LazyPage>
                        <ResourceTimingPage />
                    </LazyPage>
                ),
            },

            // 集成
            {
                path: ROUTES.HTTP_ERRORS,
                element: (
                    <LazyPage>
                        <HttpErrorsPage />
                    </LazyPage>
                ),
            },
            {
                path: ROUTES.RESOURCE_ERRORS,
                element: (
                    <LazyPage>
                        <ResourceErrorsPage />
                    </LazyPage>
                ),
            },

            // 会话
            {
                path: ROUTES.SESSIONS,
                element: (
                    <LazyPage>
                        <SessionsPage />
                    </LazyPage>
                ),
            },
            {
                path: ROUTES.SESSION_REPLAY,
                element: (
                    <LazyPage>
                        <SessionReplayPage />
                    </LazyPage>
                ),
            },

            // 告警
            {
                path: ROUTES.ALERTS,
                element: (
                    <LazyPage>
                        <AlertsPage />
                    </LazyPage>
                ),
            },
            {
                path: ROUTES.ALERT_CONFIG,
                element: (
                    <LazyPage>
                        <AlertConfigPage />
                    </LazyPage>
                ),
            },
        ],
    },
])
