/**
 * 顶部栏组件
 */

import { AppSelector } from './AppSelector'
import { UserMenu } from './UserMenu'
import { useUIStore } from '@/stores/ui.store'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
    const toggleSidebar = useUIStore(state => state.toggleSidebar)

    return (
        <header className="h-16 border-b border-[var(--border-primary)] flex items-center justify-between px-6 bg-[var(--bg-tertiary)]">
            {/* 左侧 */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                    <Menu className="w-5 h-5" />
                </Button>
                <AppSelector />
            </div>

            {/* 右侧 */}
            <div className="flex items-center gap-4">
                <UserMenu />
            </div>
        </header>
    )
}
