/**
 * 应用选择器组件
 */

import { useApplications } from '@/hooks/useApplicationQuery'
import { useCurrentApp, useSetCurrentApp } from '@/hooks/useCurrentApp'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AppSelector() {
    const { data: applications = [], isLoading } = useApplications()
    const currentAppId = useCurrentApp()
    const setCurrentAppId = useSetCurrentApp()

    console.log('[AppSelector] 应用列表:', applications)
    console.log('[AppSelector] 应用数量:', applications.length)
    console.log('[AppSelector] 当前应用ID:', currentAppId)

    if (isLoading) {
        return <div className="w-[200px] h-10 bg-[var(--bg-hover)] animate-pulse rounded-md" />
    }

    if (applications.length === 0) {
        return (
            <div className="w-[200px] px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md">
                <span className="text-sm text-[var(--text-secondary)]">暂无应用</span>
            </div>
        )
    }

    return (
        <Select value={currentAppId || ''} onValueChange={setCurrentAppId}>
            <SelectTrigger className="w-[200px] bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)]">
                <SelectValue placeholder="选择应用" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-tertiary)] border-[var(--border-primary)]">
                {applications.map(app => (
                    <SelectItem key={app.appId} value={app.appId} className="text-[var(--text-primary)] focus:bg-[var(--bg-hover)]">
                        {app.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
