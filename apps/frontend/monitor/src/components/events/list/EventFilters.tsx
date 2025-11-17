import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { X, Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { eventsAPI } from '@/api'
import { useCurrentApp } from '@/hooks/useCurrentApp'

export interface EventFiltersState {
    eventType: string
    timeRange: string
    userId?: string
}

interface EventFiltersProps {
    filters: EventFiltersState
    onFiltersChange: (filters: EventFiltersState) => void
}

export function EventFilters({ filters, onFiltersChange }: EventFiltersProps) {
    const { currentApp } = useCurrentApp()
    const [localFilters, setLocalFilters] = useState(filters)
    const [userSearch, setUserSearch] = useState('')

    // 获取用户列表
    const { data: usersData } = useQuery({
        queryKey: ['event-users', currentApp?.appId],
        queryFn: () => eventsAPI.getUsers(currentApp?.appId || ''),
        enabled: !!currentApp?.appId,
        staleTime: 5 * 60 * 1000, // 缓存5分钟
    })

    // 过滤用户列表
    const filteredUsers = useMemo(() => {
        if (!usersData?.users) return []
        if (!userSearch) return usersData.users

        const search = userSearch.toLowerCase()
        return usersData.users.filter(
            user =>
                user.id.toLowerCase().includes(search) ||
                user.email.toLowerCase().includes(search) ||
                user.username.toLowerCase().includes(search)
        )
    }, [usersData?.users, userSearch])

    const handleFilterChange = (key: keyof EventFiltersState, value: string | undefined) => {
        const newFilters = { ...localFilters, [key]: value }
        setLocalFilters(newFilters)
        onFiltersChange(newFilters)
    }

    const handleReset = () => {
        const resetFilters: EventFiltersState = {
            eventType: 'all',
            timeRange: '1h',
            userId: undefined,
        }
        setLocalFilters(resetFilters)
        onFiltersChange(resetFilters)
        setUserSearch('')
    }

    const hasActiveFilters = localFilters.eventType !== 'all' || !!localFilters.userId

    return (
        <div className="space-y-4 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">筛选条件</h3>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                        <X className="mr-1 h-4 w-4" />
                        清空
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="eventType">事件类型</Label>
                    <Select value={localFilters.eventType} onValueChange={value => handleFilterChange('eventType', value)}>
                        <SelectTrigger id="eventType">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部事件</SelectItem>
                            <SelectGroup>
                                <SelectLabel>错误事件</SelectLabel>
                                <SelectItem value="error">全部错误</SelectItem>
                                <SelectItem value="error:js">JS错误</SelectItem>
                                <SelectItem value="error:http">HTTP错误</SelectItem>
                                <SelectItem value="error:resource">资源错误</SelectItem>
                                <SelectItem value="exception">异常</SelectItem>
                                <SelectItem value="unhandledrejection">Promise拒绝</SelectItem>
                            </SelectGroup>
                            <SelectItem value="webVital">Web Vitals</SelectItem>
                            <SelectItem value="performance">性能事件</SelectItem>
                            <SelectItem value="message">日志消息</SelectItem>
                            <SelectItem value="custom">自定义事件</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="timeRange">时间范围</Label>
                    <Select value={localFilters.timeRange} onValueChange={value => handleFilterChange('timeRange', value)}>
                        <SelectTrigger id="timeRange">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="15m">最近 15 分钟</SelectItem>
                            <SelectItem value="1h">最近 1 小时</SelectItem>
                            <SelectItem value="6h">最近 6 小时</SelectItem>
                            <SelectItem value="24h">最近 24 小时</SelectItem>
                            <SelectItem value="7d">最近 7 天</SelectItem>
                            <SelectItem value="30d">最近 30 天</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="userId">用户筛选</Label>
                    <Select
                        value={localFilters.userId || 'all'}
                        onValueChange={value => handleFilterChange('userId', value === 'all' ? undefined : value)}
                    >
                        <SelectTrigger id="userId">
                            <SelectValue placeholder="全部用户" />
                        </SelectTrigger>
                        <SelectContent>
                            <div className="px-2 py-1.5">
                                <Input
                                    placeholder="搜索用户..."
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                    className="h-8"
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                            <SelectItem value="all">全部用户</SelectItem>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.username || user.email} ({user.id})
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">无匹配用户</div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}
