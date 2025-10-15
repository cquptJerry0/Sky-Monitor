import { createBrowserRouter, Navigate } from 'react-router-dom'

import { Layout } from '@/layout'
import { Alerts } from '@/views/Alerts'
import { Crons } from '@/views/Corns'
import { Dashboard } from '@/views/Dashboard'
import { Issues } from '@/views/Issues'
import { Login } from '@/views/Login'
import { Performance } from '@/views/Performance'
import { PerformanceSummary } from '@/views/PerformanceSummary'
import { Projects } from '@/views/Projects'

import AuthRoute from './AuthRoute'

// 这里是为了解决 react-router-dom 的类型问题
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                path: 'performance',
                element: <Performance />,
            },
            {
                path: 'performance/summary',
                element: <PerformanceSummary />,
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
