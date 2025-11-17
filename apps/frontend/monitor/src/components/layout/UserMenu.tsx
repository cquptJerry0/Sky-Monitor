/**
 * 用户菜单组件
 */

import { useNavigate } from 'react-router-dom'
import { useAuth, useLogout, useCurrentUser } from '@/hooks/useAuth'
import { ROUTES } from '@/utils/constants'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { User, LogOut } from 'lucide-react'

export function UserMenu() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { mutate: logout } = useLogout()

    // 获取当前用户信息
    useCurrentUser()

    if (!user) {
        return null
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback className="bg-foreground text-background">
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
                <DropdownMenuLabel className="text-foreground">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.username}</p>
                        {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)} className="text-foreground focus:bg-accent">
                    <User className="mr-2 h-4 w-4" />
                    <span>个人资料</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:bg-accent focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
