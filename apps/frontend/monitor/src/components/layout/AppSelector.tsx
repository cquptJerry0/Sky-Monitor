/**
 * 应用选择器组件
 */

import { useApplications } from '@/hooks/useApplicationQuery'
import { useCurrentApp, useSetCurrentApp } from '@/hooks/useCurrentApp'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AppSelector() {
    const { data, isLoading } = useApplications()
    const currentAppId = useCurrentApp()
    const setCurrentAppId = useSetCurrentApp()

    const applications = data?.applications || []

    if (isLoading) {
        return <div className="w-[200px] h-10 bg-[var(--bg-hover)] animate-pulse rounded-md" />
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
