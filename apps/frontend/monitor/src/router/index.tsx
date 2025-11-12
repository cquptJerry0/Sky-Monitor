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
const EventsPage = lazy(() => import('@/pages/events/EventsPage'))
const EventDetailPage = lazy(() => import('@/pages/events/EventDetailPage'))
const ErrorsPage = lazy(() => import('@/pages/errors/ErrorsPage'))
const ErrorDetailPage = lazy(() => import('@/pages/errors/ErrorDetailPage'))
const ErrorTrendsPage = lazy(() => import('@/pages/errors/ErrorTrendsPage'))
const ErrorSpikesPage = lazy(() => import('@/pages/errors/ErrorSpikesPage'))
const ErrorGroupsPage = lazy(() => import('@/pages/errors/ErrorGroupsPage'))
const PerformancePage = lazy(() => import('@/pages/performance/PerformancePage'))
const WebVitalsPage = lazy(() => import('@/pages/performance/WebVitalsPage'))
const SlowRequestsPage = lazy(() => import('@/pages/performance/SlowRequestsPage'))
const ResourceTimingPage = lazy(() => import('@/pages/performance/ResourceTimingPage'))
const HttpErrorsPage = lazy(() => import('@/pages/integrations/HttpErrorsPage'))
const ResourceErrorsPage = lazy(() => import('@/pages/integrations/ResourceErrorsPage'))
const SessionsPage = lazy(() => import('@/pages/sessions/SessionsPage'))
const SessionDetailPage = lazy(() => import('@/pages/sessions/SessionDetailPage'))
const SessionReplayPage = lazy(() => import('@/pages/sessions/SessionReplayPage'))
const AlertsPage = lazy(() => import('@/pages/alerts/AlertsPage'))
const AlertHistoryPage = lazy(() => import('@/pages/alerts/AlertHistoryPage'))
const AlertConfigPage = lazy(() => import('@/pages/alerts/AlertConfigPage'))
const UserTimelinePage = lazy(() => import('@/pages/users/UserTimelinePage'))
const TransactionsPage = lazy(() => import('@/pages/transactions/TransactionsPage'))
const TransactionDetailPage = lazy(() => import('@/pages/transactions/TransactionDetailPage'))
const MessagesPage = lazy(() => import('@/pages/messages/MessagesPage'))
const UserProfilePage = lazy(() => import('@/pages/profile/UserProfilePage'))

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
            {
                path: ROUTES.EVENT_DETAIL,
                element: (
                    <LazyPage>
                        <EventDetailPage />
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
                path: ROUTES.ERROR_DETAIL,
                element: (
                    <LazyPage>
                        <ErrorDetailPage />
                    </LazyPage>
                ),
            },
            {
                path: ROUTES.ERROR_TRENDS,
                element: (
                    <LazyPage>
                        <ErrorTrendsPage />
                    </LazyPage>
                ),
            },
            {
                path: ROUTES.ERROR_SPIKES,
                element: (
                    <LazyPage>
                        <ErrorSpikesPage />
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
                path: ROUTES.SESSION_DETAIL,
                element: (
                    <LazyPage>
                        <SessionDetailPage />
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

            // 消息
            {
                path: ROUTES.MESSAGES,
                element: (
                    <LazyPage>
                        <MessagesPage />
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
                path: ROUTES.ALERT_HISTORY,
                element: (
                    <LazyPage>
                        <AlertHistoryPage />
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

            // 用户
            {
                path: '/users/:userId/timeline',
                element: (
                    <LazyPage>
                        <UserTimelinePage />
                    </LazyPage>
                ),
            },

            // Transactions
            {
                path: '/transactions',
                element: (
                    <LazyPage>
                        <TransactionsPage />
                    </LazyPage>
                ),
            },
            {
                path: '/transactions/:id',
                element: (
                    <LazyPage>
                        <TransactionDetailPage />
                    </LazyPage>
                ),
            },

            // 用户资料
            {
                path: ROUTES.PROFILE,
                element: (
                    <LazyPage>
                        <UserProfilePage />
                    </LazyPage>
                ),
            },
        ],
    },
])
