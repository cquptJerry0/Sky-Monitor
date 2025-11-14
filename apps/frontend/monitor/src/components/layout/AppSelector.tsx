/**
 * 应用选择器组件
 */

import { useApplications } from '@/hooks/useApplicationQuery'
import { useCurrentAppId, useSetCurrentApp } from '@/hooks/useCurrentApp'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AppSelector() {
    const { data: applications = [], isLoading } = useApplications()
    const currentAppId = useCurrentAppId()
    const setCurrentAppId = useSetCurrentApp()

    if (isLoading) {
        return <div className="w-[200px] h-10 bg-muted animate-pulse rounded-md" />
    }

    if (applications.length === 0) {
        return (
            <div className="w-[200px] px-3 py-2 bg-card border border-border rounded-md">
                <span className="text-sm text-muted-foreground">暂无应用</span>
            </div>
        )
    }

    return (
        <Select value={currentAppId || ''} onValueChange={setCurrentAppId}>
            <SelectTrigger className="w-[200px] bg-card border-border text-foreground">
                <SelectValue placeholder="选择应用" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
                {applications.map(app => (
                    <SelectItem key={app.appId} value={app.appId} className="text-foreground focus:bg-accent">
                        {app.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
