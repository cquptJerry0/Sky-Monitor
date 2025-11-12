/**
 * 路由守卫
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/utils/constants'

/**
 * 认证守卫
 *
 * 未登录用户重定向到登录页
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace />
    }

    return <>{children}</>
}

/**
 * 游客守卫
 *
 * 已登录用户重定向到首页
 */
export function GuestGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth()

    if (isAuthenticated) {
        return <Navigate to={ROUTES.PROJECTS} replace />
    }

    return <>{children}</>
}
