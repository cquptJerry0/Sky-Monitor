import { ChevronDown, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '@/contexts/AppContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { appLogoMap } from '@/pages/Projects/meta'
import { Skeleton } from '@/components/ui/skeleton'

export function AppSelector() {
    const navigate = useNavigate()
    const { currentAppId, setCurrentAppId, applications, isLoading } = useAppContext()
    const [open, setOpen] = useState(false)

    const currentApp = applications.find(app => app.appId === currentAppId)

    if (isLoading) {
        return <Skeleton className="h-9 w-[200px]" />
    }

    if (applications.length === 0) {
        return (
            <Button variant="outline" onClick={() => navigate('/projects')}>
                <Plus className="h-4 w-4 mr-2" />
                创建应用
            </Button>
        )
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-between">
                    <div className="flex items-center gap-2">
                        {currentApp && (
                            <>
                                <img src={appLogoMap[currentApp.type]} alt={currentApp.type} className="h-4 w-4" />
                                <span className="truncate">{currentApp.name}</span>
                            </>
                        )}
                        {!currentApp && <span className="text-muted-foreground">选择应用</span>}
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
                <div className="max-h-[300px] overflow-auto">
                    {applications.map(app => (
                        <DropdownMenuItem
                            key={app.appId}
                            onClick={() => {
                                setCurrentAppId(app.appId)
                                setOpen(false)
                                // 触发页面刷新
                                window.location.reload()
                            }}
                            className="cursor-pointer"
                        >
                            <img src={appLogoMap[app.type]} alt={app.type} className="h-4 w-4 mr-2" />
                            <span className="truncate">{app.name}</span>
                        </DropdownMenuItem>
                    ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/projects')}>
                    <Plus className="h-4 w-4 mr-2" />
                    管理应用
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
