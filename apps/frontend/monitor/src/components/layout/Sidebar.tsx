/**
 * 侧边栏组件
 */

import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { LayoutDashboard, AlertCircle, Gauge, Users, Bell, FolderKanban, Layers } from 'lucide-react'
import { ROUTES } from '@/utils/constants'

const menuItems = [
    {
        path: ROUTES.PROJECTS,
        label: '应用',
        icon: FolderKanban,
    },
    {
        path: ROUTES.DASHBOARD,
        label: '仪表盘',
        icon: LayoutDashboard,
    },
    {
        path: ROUTES.ERRORS,
        label: '错误',
        icon: AlertCircle,
    },
    {
        path: ROUTES.PERFORMANCE,
        label: '性能',
        icon: Gauge,
    },
    {
        path: '/integrations',
        label: '集成',
        icon: Layers,
    },
    {
        path: ROUTES.SESSIONS,
        label: '会话',
        icon: Users,
    },
    {
        path: ROUTES.ALERTS,
        label: '告警',
        icon: Bell,
    },
]

interface SidebarProps {
    collapsed: boolean
}

export function Sidebar({ collapsed }: SidebarProps) {
    const location = useLocation()

    return (
        <aside
            className={cn(
                'bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-[var(--border-primary)]">
                {!collapsed && <span className="text-xl font-bold text-[var(--text-primary)]">Sky Monitor</span>}
                {collapsed && <span className="text-xl font-bold text-[var(--color-primary)]">SM</span>}
            </div>

            {/* 菜单 */}
            <nav className="p-2 space-y-1">
                {menuItems.map(item => {
                    const Icon = item.icon
                    const isActive = location.pathname.startsWith(item.path)

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors',
                                isActive
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
