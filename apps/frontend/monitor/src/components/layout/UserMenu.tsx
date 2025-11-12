/**
 * 用户菜单组件
 */

import { useAuth, useLogout } from '@/hooks/useAuth'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { User, LogOut, Settings } from 'lucide-react'

export function UserMenu() {
    const { user } = useAuth()
    const { mutate: logout } = useLogout()

    if (!user) {
        return null
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <User className="w-5 h-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[var(--bg-tertiary)] border-[var(--border-primary)]">
                <DropdownMenuLabel className="text-[var(--text-primary)]">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.username}</p>
                        {user.email && <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[var(--border-primary)]" />
                <DropdownMenuItem className="text-[var(--text-primary)] focus:bg-[var(--bg-hover)]">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>设置</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => logout()}
                    className="text-[var(--color-error)] focus:bg-[var(--bg-hover)] focus:text-[var(--color-error)]"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
