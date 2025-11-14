/**
 * 顶部栏组件
 */

import { Link, useLocation } from 'react-router-dom'
import { AppSelector } from './AppSelector'
import { UserMenu } from './UserMenu'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { ROUTES } from '@/utils/constants'

// 路由标题映射
const ROUTE_TITLES: Record<string, string> = {
    [ROUTES.PROJECTS]: '应用',
    [ROUTES.DASHBOARD]: '仪表盘',
    [ROUTES.EVENTS]: '事件',
}

export function Header() {
    const location = useLocation()

    // 获取当前路由的面包屑
    const getBreadcrumbs = () => {
        const path = location.pathname
        const breadcrumbs: Array<{ label: string; path?: string }> = [{ label: '首页', path: ROUTES.PROJECTS }]

        // 匹配当前路由
        for (const [route, title] of Object.entries(ROUTE_TITLES)) {
            if (path.startsWith(route) && route !== ROUTES.PROJECTS) {
                breadcrumbs.push({ label: title })
                break
            }
        }

        return breadcrumbs
    }

    const breadcrumbs = getBreadcrumbs()

    return (
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background">
            {/* 左侧 */}
            <div className="flex items-center gap-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumbs.map((crumb, index) => (
                            <BreadcrumbItem key={index}>
                                {index < breadcrumbs.length - 1 ? (
                                    <>
                                        <BreadcrumbLink asChild>
                                            <Link to={crumb.path!}>{crumb.label}</Link>
                                        </BreadcrumbLink>
                                        <BreadcrumbSeparator />
                                    </>
                                ) : (
                                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                )}
                            </BreadcrumbItem>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
                <AppSelector />
            </div>

            {/* 右侧 */}
            <div className="flex items-center gap-4">
                <UserMenu />
            </div>
        </header>
    )
}
