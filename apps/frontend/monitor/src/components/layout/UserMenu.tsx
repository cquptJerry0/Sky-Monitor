/**
 * 用户菜单组件
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useLogout, useLogoutAll } from '@/hooks/useAuth'
import { ROUTES } from '@/utils/constants'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { User, LogOut, Settings, Shield } from 'lucide-react'

export function UserMenu() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { mutate: logout } = useLogout()
    const { mutate: logoutAll } = useLogoutAll()
    const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false)

    if (!user) {
        return null
    }

    const handleLogoutAll = () => {
        logoutAll()
        setShowLogoutAllDialog(false)
    }

    return (
        <>
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
                    <DropdownMenuItem
                        onClick={() => navigate(ROUTES.PROFILE)}
                        className="text-[var(--text-primary)] focus:bg-[var(--bg-hover)]"
                    >
                        <User className="mr-2 h-4 w-4" />
                        <span>个人资料</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-[var(--text-primary)] focus:bg-[var(--bg-hover)]">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>设置</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowLogoutAllDialog(true)} className="text-foreground focus:bg-accent">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>登出所有设备</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:bg-accent focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>退出登录</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showLogoutAllDialog} onOpenChange={setShowLogoutAllDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认登出所有设备？</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作将登出您在所有设备上的登录状态，包括当前设备。您需要重新登录才能继续使用。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogoutAll}>确认登出</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
