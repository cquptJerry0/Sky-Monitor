/**
 * 侧边栏组件
 */

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FolderKanban, Layers, PanelLeftClose, PanelLeft } from 'lucide-react'
import { ROUTES } from '@/utils/constants'
import { useUIStore } from '@/stores/ui.store'

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
        path: ROUTES.EVENTS,
        label: '事件',
        icon: Layers,
    },
]

interface SidebarProps {
    collapsed: boolean
}

export function Sidebar({ collapsed }: SidebarProps) {
    const location = useLocation()
    const toggleSidebar = useUIStore(state => state.toggleSidebar)
    const [showText, setShowText] = useState(!collapsed)

    useEffect(() => {
        if (collapsed) {
            setShowText(false)
            return
        } else {
            const timer = setTimeout(() => {
                setShowText(true)
            }, 300)
            return () => clearTimeout(timer)
        }
    }, [collapsed])

    return (
        <aside
            className={cn('bg-card border-r border-border transition-all duration-300 flex flex-col relative', collapsed ? 'w-16' : 'w-64')}
        >
            {/* Logo */}
            <div className="h-16 flex items-center gap-3 px-4 border-b border-border">
                <img src="/logo.svg" alt="Sky Monitor" className="h-8 w-8 flex-shrink-0" />
                {showText && <span className="text-xl font-bold text-foreground">Sky Monitor</span>}
            </div>

            {/* 菜单 */}
            <nav className="p-2 space-y-1 flex-1">
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
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {showText && <span className="text-sm font-medium">{item.label}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* 右侧边缘触发区域 */}
            <div
                className="sidebar-toggle-trigger absolute top-0 -right-2 h-full w-4 group cursor-pointer z-50"
                onClick={toggleSidebar}
                title={collapsed ? '展开侧边栏' : '收起侧边栏'}
            >
                {/* 悬浮时显示的指示条 */}
                <div className="absolute top-[23%] right-2 -translate-y-1/2 h-24 w-1 bg-primary/0 group-hover:bg-primary/60 transition-all duration-200 rounded-full" />

                {/* 悬浮时显示的图标 */}
                <div className="absolute top-[23%] right-2 -translate-y-1/2 translate-x-0 opacity-0 group-hover:translate-x-3 group-hover:opacity-100 transition-all duration-200">
                    <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
                        {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                    </div>
                </div>
            </div>
        </aside>
    )
}
