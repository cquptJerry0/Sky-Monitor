import { createBrowserRouter, Navigate } from 'react-router-dom'

import { Layout } from '@/layout'
import { Alerts } from '@/views/Alerts'
import { AlertsConfig } from '@/views/AlertsConfig'
import { Crons } from '@/views/Corns'
import { Dashboard } from '@/views/Dashboard'
import { Errors } from '@/views/Errors'
import { ErrorGroups } from '@/views/ErrorGroups'
import { HttpErrors } from '@/views/HttpErrors'
import { Issues } from '@/views/Issues'
import { Login } from '@/views/Login'
import { Performance } from '@/views/Performance'
import { PerformanceMonitoring } from '@/views/PerformanceMonitoring'
import { PerformanceSummary } from '@/views/PerformanceSummary'
import { Projects } from '@/views/Projects'
import { ResourceErrors } from '@/views/ResourceErrors'
import { ResourceTiming } from '@/views/ResourceTiming'
import { SessionReplay } from '@/views/SessionReplay'
import { Sessions } from '@/views/Sessions'
import { WebVitals } from '@/views/WebVitals'

import AuthRoute from './AuthRoute'

// 这里是为了解决 react-router-dom 的类型问题

type PickRouter<T> = T extends (...args: any[]) => infer R ? R : never

type A = typeof createBrowserRouter

export const router: PickRouter<A> = createBrowserRouter([
    {
        path: '/',
        element: (
            <AuthRoute>
                <Layout />
            </AuthRoute>
        ),
        children: [
            {
                path: 'projects',
                element: <Projects />,
            },
            {
                path: 'issues',
                element: <Issues />,
            },
            {
                path: 'errors',
                element: <Errors />,
            },
            {
                path: 'errors/groups',
                element: <ErrorGroups />,
            },
            {
                path: 'performance',
                element: <Performance />,
            },
            {
                path: 'performance/monitoring',
                element: <PerformanceMonitoring />,
            },
            {
                path: 'performance/summary',
                element: <PerformanceSummary />,
            },
            {
                path: 'performance/web-vitals',
                element: <WebVitals />,
            },
            {
                path: 'performance/resource-timing',
                element: <ResourceTiming />,
            },
            {
                path: 'integrations/http-errors',
                element: <HttpErrors />,
            },
            {
                path: 'integrations/resource-errors',
                element: <ResourceErrors />,
            },
            {
                path: 'sessions',
                element: <Sessions />,
            },
            {
                path: 'sessions/:sessionId/replay',
                element: <SessionReplay />,
            },
            {
                path: 'dashboard',
                element: <Dashboard />,
            },
            {
                path: 'crons',
                element: <Crons />,
            },
            {
                path: 'alerts',
                element: <Alerts />,
            },
            {
                path: 'settings/alerts',
                element: <AlertsConfig />,
            },
            {
                path: '/',
                element: <Navigate to="/projects" replace />,
            },
        ],
    },
    {
        path: '/account/login',
        element: <Login />,
    },
])
