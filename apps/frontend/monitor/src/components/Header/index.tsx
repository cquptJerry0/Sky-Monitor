import { ReactNode } from 'react'
import { Bell, Search } from 'lucide-react'
import { AppSelector } from '../AppSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface HeaderProps {
    children?: ReactNode
}

export function Header({ children }: HeaderProps) {
    return (
        <header className="h-14 border-b bg-white px-4 lg:h-[60px] lg:px-6">
            <div className="flex h-full items-center justify-between">
                {/* 左侧 - 应用选择器 */}
                <div className="flex items-center gap-4">
                    <AppSelector />
                </div>

                {/* 中间 - 搜索框 */}
                <div className="flex-1 max-w-md mx-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="搜索错误、性能问题..." className="pl-8 bg-muted/40" />
                    </div>
                </div>

                {/* 右侧 - 通知和其他操作 */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-4 w-4" />
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                            3
                        </span>
                    </Button>
                    {children}
                </div>
            </div>
        </header>
    )
}
